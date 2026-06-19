using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace ORYND.CadBridge.SolidWorks
{
    internal sealed class BridgeClient : IDisposable
    {
        private readonly HttpClient _client;

        public BridgeClient(string baseUrl)
        {
            _client = new HttpClient
            {
                BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/"),
                Timeout = TimeSpan.FromSeconds(30)
            };
        }

        public async Task<string> GenerateMacroPreviewAsync(string prompt)
        {
            string escapedPrompt = EscapeJson(prompt);
            string body = "{\"prompt\":\"" + escapedPrompt + "\"}";
            using (var content = new StringContent(body, Encoding.UTF8, "application/json"))
            using (var response = await _client.PostAsync("api/generate", content).ConfigureAwait(false))
            {
                string payload = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
                if (!response.IsSuccessStatusCode)
                {
                    throw new InvalidOperationException("CAD Bridge returned " + (int)response.StatusCode + ": " + payload);
                }
                return payload;
            }
        }

        public async Task<string> GetEntitlementAsync()
        {
            using (var response = await _client.GetAsync("api/entitlement").ConfigureAwait(false))
            {
                string payload = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
                if (!response.IsSuccessStatusCode)
                {
                    throw new InvalidOperationException("CAD Bridge returned " + (int)response.StatusCode + ": " + payload);
                }
                return payload;
            }
        }

        public void Dispose()
        {
            _client.Dispose();
        }

        private static string EscapeJson(string value)
        {
            if (value == null)
            {
                return string.Empty;
            }

            return value
                .Replace("\\", "\\\\")
                .Replace("\"", "\\\"")
                .Replace("\r", "\\r")
                .Replace("\n", "\\n")
                .Replace("\t", "\\t");
        }
    }
}

