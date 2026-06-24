using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Windows.Forms;
using SolidWorks.Interop.sldworks;
using SolidWorks.Interop.swpublished;

namespace ORYND.CadBridge.SolidWorks
{
    [ComVisible(true)]
    [Guid("B7F2B6BE-AC0E-4591-A466-BA92A238E9D4")]
    [ProgId("ORYND.CadBridge.SolidWorksAddin")]
    public sealed class SwAddin : ISwAddin
    {
        private const string BridgeUrl = "http://127.0.0.1:8765";
        private SldWorks _solidWorks;
        private int _addinCookie;
        private BridgeClient _bridgeClient;
        private TaskpaneView _taskPaneView;
        private CadBridgeTaskPaneControl _taskPaneControl;

        public bool ConnectToSW(object ThisSW, int Cookie)
        {
            _solidWorks = (SldWorks)ThisSW;
            _addinCookie = Cookie;
            _bridgeClient = new BridgeClient(BridgeUrl);
            _solidWorks.SetAddinCallbackInfo2(0, this, _addinCookie);
            CreateTaskPane();
            SendMessage("ORYND CAD Bridge connected. Open the ORYND task pane from the right-side SolidWorks Task Pane.");
            return true;
        }

        public bool DisconnectFromSW()
        {
            if (_taskPaneView != null)
            {
                _taskPaneView.DeleteView();
                Marshal.ReleaseComObject(_taskPaneView);
                _taskPaneView = null;
            }
            _taskPaneControl?.Dispose();
            _taskPaneControl = null;

            _bridgeClient?.Dispose();
            _bridgeClient = null;

            if (_solidWorks != null)
            {
                Marshal.ReleaseComObject(_solidWorks);
                _solidWorks = null;
            }

            _addinCookie = 0;
            return true;
        }

        public void OpenCompanionUi()
        {
            if (_taskPaneControl != null)
            {
                _taskPaneControl.FocusPrompt();
                return;
            }

            Process.Start(new ProcessStartInfo { FileName = BridgeUrl, UseShellExecute = true });
        }

        public void GenerateBrakeDiscPreview()
        {
            try
            {
                string prompt = "Create a 280 mm vented brake disc with 5 bolt holes. Generate a validated macro preview only.";
                string payload = _bridgeClient.GenerateMacroPreviewAsync(prompt).GetAwaiter().GetResult();
                if (_taskPaneControl != null)
                {
                    _taskPaneControl.SetPreview(payload);
                }
                SendMessage("ORYND CAD Bridge preview generated. Review it in the task pane before execution.");
            }
            catch (Exception ex)
            {
                SendMessage("ORYND CAD Bridge error: " + ex.Message);
            }
        }

        public void CheckEntitlement()
        {
            try
            {
                string payload = _bridgeClient.GetEntitlementAsync().GetAwaiter().GetResult();
                SendMessage("ORYND CAD Bridge entitlement response: " + payload);
            }
            catch (Exception ex)
            {
                SendMessage("ORYND CAD Bridge error: " + ex.Message);
            }
        }

        private void SendMessage(string message)
        {
            if (_solidWorks == null)
            {
                return;
            }

            _solidWorks.SendMsgToUser(message);
        }

        private void CreateTaskPane()
        {
            if (_solidWorks == null || _taskPaneView != null)
            {
                return;
            }

            _taskPaneView = _solidWorks.CreateTaskpaneView2("", "ORYND CAD Bridge");
            object control = _taskPaneView.AddControl("ORYND.CadBridge.TaskPaneControl", "");
            _taskPaneControl = control as CadBridgeTaskPaneControl;
            _taskPaneControl?.Attach(_bridgeClient, this);
        }
    }
}
