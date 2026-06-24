;;; ORYND CAD Bridge — AutoCAD AutoLISP thin client
;;;
;;; Architecture:
;;;   ORYND command → reads current drawing context
;;;              → sends prompt + context to local bridge (127.0.0.1:8765)
;;;              → receives macro code (AutoLISP)
;;;              → executes macro in-session
;;;
;;; Commands:
;;;   ORYND        — open ORYND panel in browser (full UI)
;;;   ORYND-RUN    — run prompt from command line (no browser)
;;;   ORYND-APPLY  — apply last generated macro
;;;
;;; Install (manual):
;;;   Copy ORYNDAutoCADPlugin.bundle to:
;;;     Windows: %APPDATA%\Autodesk\ApplicationPlugins\
;;;     Mac:     ~/Library/Application Support/Autodesk/ApplicationPlugins/
;;;   Or load this file directly: APPLOAD → add to Startup Suite

(setq *ORYND-BRIDGE-URL* "http://127.0.0.1:8765")
(setq *ORYND-LAST-MACRO* nil)

;;; ──────────────────────────────────────────────
;;; Utility: GET current drawing context as string
;;; ──────────────────────────────────────────────

(defun orynd-get-context ( / doc-name layer-count obj-count)
  (setq doc-name  (getvar "DWGNAME"))
  (setq layer-count (vla-get-count (vla-get-layers (vla-get-activedocument (vlax-get-acad-object)))))
  (setq obj-count (vla-get-count (vla-get-modelspace (vla-get-activedocument (vlax-get-acad-object)))))
  (strcat
    "{\"host\":\"autocad\","
    "\"doc\":\"" doc-name "\","
    "\"layers\":" (itoa layer-count) ","
    "\"objects\":" (itoa obj-count) "}"
  )
)

;;; ──────────────────────────────────────────────
;;; Utility: Send POST to local bridge (Windows)
;;; Uses VBA shell trick via WScript.Shell
;;; ──────────────────────────────────────────────

(defun orynd-post-to-bridge (endpoint body / shell result-file cmd)
  (setq result-file (strcat (getenv "TEMP") "\\orynd_result.json"))
  (setq cmd (strcat
    "powershell -NoProfile -Command \""
    "$body = '" body "';"
    "$r = Invoke-RestMethod -Uri '" *ORYND-BRIDGE-URL* endpoint "' "
    "-Method POST -ContentType 'application/json' -Body $body;"
    "$r | ConvertTo-Json | Set-Content -Path '" result-file "'\""))
  (startapp "cmd" (strcat "/c " cmd))
  ;; Wait briefly for response
  (command "._DELAY" 3000)
  result-file
)

;;; ──────────────────────────────────────────────
;;; ORYND: Open full UI in browser
;;; ──────────────────────────────────────────────

(defun c:ORYND ( / )
  (startapp "cmd" (strcat "/c start " *ORYND-BRIDGE-URL*))
  (princ (strcat "\nORYND panel opened at " *ORYND-BRIDGE-URL*))
  (princ)
)

;;; ──────────────────────────────────────────────
;;; ORYND-RUN: Inline prompt → macro → execute
;;; ──────────────────────────────────────────────

(defun c:ORYND-RUN ( / prompt context body result-file macro-code)
  (setq prompt (getstring T "\nORYND prompt: "))
  (if (= prompt "")
    (progn (princ "\nCancelled.") (princ) (exit)))

  (princ "\nSending to ORYND AI...")
  (setq context (orynd-get-context))
  (setq body (strcat
    "{\"prompt\":\"" prompt "\","
    "\"target\":\"autocad_lisp\","
    "\"context\":" context "}"))

  (setq result-file (orynd-post-to-bridge "/api/generate" body))

  ;; Read result and load macro
  (if (findfile result-file)
    (progn
      (princ "\nORYND macro ready. Use ORYND-APPLY to execute.")
      (setq *ORYND-LAST-MACRO* result-file)
    )
    (princ "\nORYND: no response from bridge. Is it running?")
  )
  (princ)
)

;;; ──────────────────────────────────────────────
;;; ORYND-APPLY: Execute last received macro
;;; ──────────────────────────────────────────────

(defun c:ORYND-APPLY ( / )
  (if *ORYND-LAST-MACRO*
    (progn
      (princ (strcat "\nApplying ORYND macro from " *ORYND-LAST-MACRO*))
      (load *ORYND-LAST-MACRO*)
    )
    (princ "\nNo macro loaded. Run ORYND-RUN first.")
  )
  (princ)
)

;;; ──────────────────────────────────────────────
;;; ORYND-STATUS: Check bridge connectivity
;;; ──────────────────────────────────────────────

(defun c:ORYND-STATUS ( / )
  (princ (strcat "\nORYND bridge: " *ORYND-BRIDGE-URL*))
  (princ "\nCommands: ORYND (browser UI) | ORYND-RUN (inline) | ORYND-APPLY (execute last)")
  (princ)
)

;;; Short alias
(defun c:OR ( / ) (c:ORYND))

(princ "\nORYND CAD Bridge loaded.")
(princ "\n  ORYND       — open browser panel")
(princ "\n  ORYND-RUN   — run prompt inline")
(princ "\n  ORYND-APPLY — apply last macro")
(princ)
