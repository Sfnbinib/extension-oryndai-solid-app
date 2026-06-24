using System;
using System.Drawing;
using System.IO;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace ORYND.CadBridge.SolidWorks
{
    [System.Runtime.InteropServices.ComVisible(true)]
    [System.Runtime.InteropServices.ProgId("ORYND.CadBridge.TaskPaneControl")]
    public sealed class CadBridgeTaskPaneControl : UserControl
    {
        private BridgeClient _bridgeClient;
        private SwAddin _addin;
        private string _lastPreviewPayload;
        private readonly TextBox _promptBox;
        private readonly TextBox _previewBox;
        private readonly Label _statusLabel;
        private readonly Button _approveRunButton;
        private readonly Button _savePreviewButton;

        public CadBridgeTaskPaneControl()
        {
            Dock = DockStyle.Fill;
            BackColor = Color.FromArgb(18, 24, 32);

            var layout = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                ColumnCount = 1,
                RowCount = 8,
                Padding = new Padding(10),
                BackColor = BackColor
            };
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 32));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 82));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 36));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 24));
            layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 36));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 36));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 22));

            var title = new Label
            {
                Text = "ORYND CAD Bridge",
                ForeColor = Color.White,
                Font = new Font("Segoe UI", 11, FontStyle.Bold),
                Dock = DockStyle.Fill
            };

            _promptBox = new TextBox
            {
                Multiline = true,
                Dock = DockStyle.Fill,
                Text = "Create a 280 mm brake disc with 5 bolt holes and STEP export.",
                BackColor = Color.FromArgb(31, 41, 55),
                ForeColor = Color.White,
                BorderStyle = BorderStyle.FixedSingle,
                ScrollBars = ScrollBars.Vertical
            };

            var generateButton = new Button
            {
                Text = "Generate Preview",
                Dock = DockStyle.Fill,
                BackColor = Color.FromArgb(15, 118, 110),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat
            };
            generateButton.Click += async (_, __) => await GeneratePreviewAsync();

            _statusLabel = new Label
            {
                Text = "Preview only. Execution requires validation and explicit approval.",
                ForeColor = Color.FromArgb(209, 213, 219),
                Dock = DockStyle.Fill
            };

            _previewBox = new TextBox
            {
                Multiline = true,
                Dock = DockStyle.Fill,
                BackColor = Color.FromArgb(15, 23, 42),
                ForeColor = Color.FromArgb(229, 231, 235),
                BorderStyle = BorderStyle.FixedSingle,
                ScrollBars = ScrollBars.Both,
                WordWrap = false,
                Text = "Generated operation plan and macro preview will appear here."
            };

            var actions = new FlowLayoutPanel
            {
                Dock = DockStyle.Fill,
                FlowDirection = FlowDirection.LeftToRight,
                BackColor = BackColor
            };
            actions.Controls.Add(MakeSecondaryButton("Open Local Bridge", (_, __) => _addin?.OpenCompanionUi()));
            actions.Controls.Add(MakeSecondaryButton("Check Entitlement", (_, __) => _addin?.CheckEntitlement()));

            var approvalActions = new FlowLayoutPanel
            {
                Dock = DockStyle.Fill,
                FlowDirection = FlowDirection.LeftToRight,
                BackColor = BackColor
            };

            _approveRunButton = MakePrimaryButton("Approve & Run", (_, __) => ShowExecutionDisabled());
            _approveRunButton.Enabled = false;
            _savePreviewButton = MakeSecondaryButton("Save Preview JSON", (_, __) => SavePreviewPayload());
            _savePreviewButton.Enabled = false;
            approvalActions.Controls.Add(_approveRunButton);
            approvalActions.Controls.Add(_savePreviewButton);

            var footer = new Label
            {
                Text = "Preview scaffold - SolidWorks execution remains locked until runtime QA passes.",
                ForeColor = Color.FromArgb(156, 163, 175),
                Dock = DockStyle.Fill
            };

            layout.Controls.Add(title, 0, 0);
            layout.Controls.Add(_promptBox, 0, 1);
            layout.Controls.Add(generateButton, 0, 2);
            layout.Controls.Add(_statusLabel, 0, 3);
            layout.Controls.Add(_previewBox, 0, 4);
            layout.Controls.Add(actions, 0, 5);
            layout.Controls.Add(approvalActions, 0, 6);
            layout.Controls.Add(footer, 0, 7);

            Controls.Add(layout);
        }

        public void Attach(BridgeClient bridgeClient, SwAddin addin)
        {
            _bridgeClient = bridgeClient;
            _addin = addin;
        }

        public void FocusPrompt()
        {
            _promptBox.Focus();
        }

        public void SetPreview(string preview)
        {
            _lastPreviewPayload = preview;
            _previewBox.Text = preview;
            _statusLabel.Text = "Preview ready. Review validation; execution is disabled in this scaffold.";
            _approveRunButton.Enabled = true;
            _savePreviewButton.Enabled = true;
        }

        private async Task GeneratePreviewAsync()
        {
            try
            {
                if (_bridgeClient == null)
                {
                    _statusLabel.Text = "Bridge client is not attached yet.";
                    return;
                }
                _approveRunButton.Enabled = false;
                _savePreviewButton.Enabled = false;
                _statusLabel.Text = "Status: generating preview through local bridge...";
                string result = await _bridgeClient.GenerateMacroPreviewAsync(_promptBox.Text).ConfigureAwait(true);
                SetPreview(result);
            }
            catch (Exception ex)
            {
                _statusLabel.Text = "Error: " + ex.Message;
            }
        }

        private void ShowExecutionDisabled()
        {
            _statusLabel.Text = "Approve & Run is intentionally disabled until SolidWorks runtime execution is verified.";
            MessageBox.Show(
                "Runtime execution is disabled in this scaffold.\n\nNext QA step: save the preview JSON, inspect the macro, then run a controlled manual SolidWorks smoke test on Windows.",
                "ORYND CAD Bridge",
                MessageBoxButtons.OK,
                MessageBoxIcon.Information
            );
        }

        private void SavePreviewPayload()
        {
            if (string.IsNullOrWhiteSpace(_lastPreviewPayload))
            {
                _statusLabel.Text = "No preview generated yet.";
                return;
            }

            string directory = Path.Combine(Path.GetTempPath(), "ORYND_CAD_Bridge");
            Directory.CreateDirectory(directory);
            string path = Path.Combine(directory, "last_preview.json");
            File.WriteAllText(path, _lastPreviewPayload);
            _statusLabel.Text = "Saved preview JSON: " + path;
        }

        private static Button MakeSecondaryButton(string text, EventHandler onClick)
        {
            var button = new Button
            {
                Text = text,
                Width = 142,
                Height = 28,
                BackColor = Color.FromArgb(55, 65, 81),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat
            };
            button.Click += onClick;
            return button;
        }

        private static Button MakePrimaryButton(string text, EventHandler onClick)
        {
            var button = new Button
            {
                Text = text,
                Width = 142,
                Height = 28,
                BackColor = Color.FromArgb(214, 162, 30),
                ForeColor = Color.Black,
                FlatStyle = FlatStyle.Flat
            };
            button.Click += onClick;
            return button;
        }
    }
}
