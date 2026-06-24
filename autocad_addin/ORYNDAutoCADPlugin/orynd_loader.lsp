;;; ORYND CAD Bridge — AutoCAD AutoLISP Loader
;;;
;;; Adds ORYND command to AutoCAD. Opens the local bridge UI in default browser.
;;;
;;; Install:
;;;   Option A (one-time): APPLOAD > add this file > Add to Startup Suite
;;;   Option B (manual):   Type APPLOAD in AutoCAD > load orynd_loader.lsp
;;;
;;; After loading, type:  ORYND  in the AutoCAD command line

(defun c:ORYND ( / )
  "Open the ORYND CAD Bridge panel in the default browser."
  (startapp "cmd" "/c start http://127.0.0.1:8765")
  (princ "\nORYND CAD Bridge opened in browser.")
  (princ)
)

;;; Also register a shorter alias
(defun c:OR ( / ) (c:ORYND))

(princ "\nORYND CAD Bridge loaded. Type ORYND to open.")
(princ)
