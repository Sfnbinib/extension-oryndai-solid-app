// ORYND CAD Bridge — AutoCAD .NET Plugin (thin client)
//
// Architecture: Task Pane WebBrowser → local bridge 127.0.0.1:8765 → AWS/Opus
//               → macro code (AutoLISP) → SendStringToExecute in AutoCAD
//
// Build: requires AutoCAD .NET API references (acmgd.dll, acdbmgd.dll, accoremgd.dll)
// Target: .NET Framework 4.8, x64

using System;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using Autodesk.AutoCAD.ApplicationServices;
using Autodesk.AutoCAD.DatabaseServices;
using Autodesk.AutoCAD.EditorInput;
using Autodesk.AutoCAD.Runtime;

[assembly: CommandClass(typeof(ORYNDAutoCAD.ORYNDPlugin))]
[assembly: ExtensionApplication(typeof(ORYNDAutoCAD.ORYNDPlugin))]

namespace ORYNDAutoCAD
{
    public class ORYNDPlugin : IExtensionApplication
    {
        private const string BridgeUrl = "http://127.0.0.1:8765";
        private static readonly HttpClient _http = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
        private static PaletteSet _palette;

        // ── IExtensionApplication ──────────────────────────────────────

        public void Initialize()
        {
            Autodesk.AutoCAD.ApplicationServices.Application.Idle += OnIdle;
        }

        public void Terminate() { }

        private static bool _initialized = false;

        private void OnIdle(object sender, EventArgs e)
        {
            if (_initialized) return;
            _initialized = true;
            Autodesk.AutoCAD.ApplicationServices.Application.Idle -= OnIdle;
            // Auto-show panel on first load
            // ShowPanel();  // uncomment to auto-open
        }

        // ── Commands ──────────────────────────────────────────────────

        [CommandMethod("ORYND", CommandFlags.Modal)]
        public static void ShowORYND()
        {
            ShowPanel();
        }

        [CommandMethod("ORYND-RUN", CommandFlags.Modal)]
        public static void RunPrompt()
        {
            var doc = Autodesk.AutoCAD.ApplicationServices.Application.DocumentManager.MdiActiveDocument;
            var ed = doc.Editor;

            var promptResult = ed.GetString(new PromptStringOptions("\nORYND prompt: ") { AllowSpaces = true });
            if (promptResult.Status != PromptStatus.OK || string.IsNullOrWhiteSpace(promptResult.StringResult))
                return;

            ed.WriteMessage("\nSending to ORYND AI...");

            Task.Run(async () =>
            {
                try
                {
                    var context = GetDrawingContext(doc);
                    var body = $"{{\"prompt\":\"{EscapeJson(promptResult.StringResult)}\",\"target\":\"autocad_lisp\",\"context\":{context}}}";
                    var content = new StringContent(body, Encoding.UTF8, "application/json");
                    var response = await _http.PostAsync($"{BridgeUrl}/api/generate", content);
                    var json = await response.Content.ReadAsStringAsync();

                    // Extract macro_code from JSON (simple parse without dependency)
                    var macroCode = ExtractJsonString(json, "macro_code");
                    if (macroCode == null)
                    {
                        doc.Editor.WriteMessage("\nORYND: could not parse response.");
                        return;
                    }

                    // Write to temp file and APPLOAD
                    var tmpFile = Path.Combine(Path.GetTempPath(), "orynd_macro.lsp");
                    File.WriteAllText(tmpFile, macroCode);

                    Autodesk.AutoCAD.ApplicationServices.Application.DocumentManager.MdiActiveDocument
                        .SendStringToExecute($"(load \"{tmpFile.Replace("\\", "/")}\") ", false, false, false);

                    doc.Editor.WriteMessage("\nORYND macro applied.");
                }
                catch (Exception ex)
                {
                    doc.Editor.WriteMessage($"\nORYND error: {ex.Message}");
                }
            });
        }

        // ── Panel (WebBrowser task pane) ──────────────────────────────

        private static void ShowPanel()
        {
            if (_palette != null)
            {
                _palette.Visible = !_palette.Visible;
                return;
            }

            _palette = new PaletteSet("ORYND", new Guid("A1B2C3D4-E5F6-7890-ABCD-EF1234567891"))
            {
                Style = PaletteSetStyles.ShowCloseButton |
                        PaletteSetStyles.ShowAutoHideButton |
                        PaletteSetStyles.Snappable,
                MinimumSize = new System.Drawing.Size(320, 400),
            };

            var browser = new WebBrowser
            {
                Dock = DockStyle.Fill,
                ScriptErrorsSuppressed = true,
                Url = new Uri($"{BridgeUrl}/cloud-design"),
            };
            browser.ObjectForScripting = new BrowserBridge();

            var panel = new Palette();
            panel.Name = "ORYND";
            panel.Size = new System.Drawing.Size(380, 600);
            panel.AddVisual("ORYND", browser);

            _palette.Add("ORYND", panel);
            _palette.Visible = true;
        }

        // ── Drawing context ───────────────────────────────────────────

        private static string GetDrawingContext(Document doc)
        {
            try
            {
                using var tr = doc.Database.TransactionManager.StartTransaction();
                var bt = (BlockTable)tr.GetObject(doc.Database.BlockTableId, OpenMode.ForRead);
                var ms = (BlockTableRecord)tr.GetObject(bt[BlockTableRecord.ModelSpace], OpenMode.ForRead);
                int objCount = 0;
                foreach (ObjectId _ in ms) objCount++;
                tr.Commit();
                return $"{{\"host\":\"autocad\",\"doc\":\"{EscapeJson(doc.Name)}\",\"objects\":{objCount}}}";
            }
            catch
            {
                return "{\"host\":\"autocad\"}";
            }
        }

        // ── Helpers ───────────────────────────────────────────────────

        private static string EscapeJson(string s) =>
            s.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\n", "\\n");

        private static string ExtractJsonString(string json, string key)
        {
            var search = $"\"{key}\":\"";
            var start = json.IndexOf(search, StringComparison.Ordinal);
            if (start < 0) return null;
            start += search.Length;
            var end = start;
            while (end < json.Length)
            {
                if (json[end] == '"' && (end == 0 || json[end - 1] != '\\')) break;
                end++;
            }
            return json.Substring(start, end - start).Replace("\\n", "\n").Replace("\\\"", "\"").Replace("\\\\", "\\");
        }
    }

    // COM-visible bridge so JavaScript in the WebBrowser can call C# methods
    [System.Runtime.InteropServices.ComVisible(true)]
    public class BrowserBridge
    {
        private const string BridgeUrl = "http://127.0.0.1:8765";

        public string GetHost() => "autocad";

        public void ApplyMacro(string macroCode)
        {
            var tmpFile = Path.Combine(Path.GetTempPath(), "orynd_macro.lsp");
            File.WriteAllText(tmpFile, macroCode);
            var doc = Autodesk.AutoCAD.ApplicationServices.Application.DocumentManager.MdiActiveDocument;
            doc?.SendStringToExecute($"(load \"{tmpFile.Replace("\\", "/")}\") ", false, false, false);
        }
    }
}
