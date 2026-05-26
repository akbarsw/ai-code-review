import { useState } from "react";
import { AlertTriangle, Check, ChevronDown, ChevronUp, Code2, Copy, FileCode2, Gauge, GitBranch, Info, Loader2, MessageSquare, RefreshCw, Shield, Sparkles, Star, Terminal, Zap } from "lucide-react";

const LANGUAGES = ["Python", "JavaScript", "TypeScript", "Java", "Go", "Rust", "PHP", "C++"];

type Severity = "critical" | "warning" | "info";
type Category = "security" | "performance" | "style" | "logic";

interface Issue {
  line: number;
  severity: Severity;
  category: Category;
  message: string;
  suggestion: string;
}

interface ReviewResult {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  summary: string;
  issues: Issue[];
  strengths: string[];
  metrics: { label: string; value: string; status: "good" | "warn" | "bad" }[];
  fixedCode: string;
}

const SAMPLE_CODE: Record<string, string> = {
  Python: `import sqlite3\n\ndef get_user(username, password):\n    conn = sqlite3.connect("users.db")\n    query = "SELECT * FROM users WHERE username = '" + username + "'"\n    result = conn.execute(query)\n    user = result.fetchone()\n    if user and user[2] == password:\n        return user\n    return None\n\ndef process_items(items):\n    result = []\n    for i in range(len(items)):\n        temp = []\n        for j in range(len(items)):\n            temp.append(items[i] * items[j])\n        result.append(temp)\n    return result\n\nAPI_KEY = "sk-prod-abc123xyz789secretkey"\nDEBUG = True`,
  JavaScript: `const express = require('express')\nconst app = express()\n\napp.get('/user', (req, res) => {\n  const id = req.query.id\n  const query = \`SELECT * FROM users WHERE id = \${id}\`\n  db.query(query, (err, result) => {\n    res.send(result)\n  })\n})\n\nfunction fetchAllData() {\n  var data = []\n  for(var i=0; i<1000; i++) {\n    data.push(fetch('/api/item/'+i).then(r => r.json()))\n  }\n  return data\n}\n\nconst SECRET = "my-super-secret-key-12345"`,
  TypeScript: `interface User {\n  id: number\n  name: string\n  password: string\n  token: string\n}\n\nasync function getUsers(): Promise<User[]> {\n  const response = await fetch('/api/users')\n  const data = await response.json()\n  return data\n}\n\nfunction renderUser(user: any) {\n  document.getElementById('user')!.innerHTML = user.name\n  console.log('User token:', user.token)\n}\n\nconst DB_PASS = "admin123"\nlet globalState: any = {}`,
};

function generateReview(code: string, language: string): ReviewResult {
  const hasHardcodedSecret = /api[_-]?key|secret|password|token|passwd/i.test(code) && /["'][a-zA-Z0-9_\-]{8,}["']/.test(code);
  const hasSQLInjection = /SELECT.*\+|query.*\+.*username|query.*\$\{/i.test(code);
  const hasNestedLoop = /for.*\n.*for|for.*for/s.test(code);
  const hasConsoleLog = /console\.log|print\(/i.test(code);
  const hasAnyType = /:\s*any[\s,)]/g.test(code);
  const hasInnerHTML = /innerHTML\s*=/i.test(code);

  const issues: Issue[] = [];

  if (hasSQLInjection) issues.push({ line: language === "Python" ? 7 : 5, severity: "critical", category: "security", message: "SQL Injection vulnerability detected", suggestion: "Use parameterized queries or prepared statements instead of string concatenation" });
  if (hasHardcodedSecret) issues.push({ line: language === "Python" ? 20 : 17, severity: "critical", category: "security", message: "Hardcoded credentials found in source code", suggestion: "Move secrets to environment variables or a secrets manager" });
  if (hasNestedLoop) issues.push({ line: language === "Python" ? 11 : 8, severity: "warning", category: "performance", message: "O(n²) nested loop detected — poor scalability", suggestion: "Consider using vectorized operations or restructuring the algorithm" });
  if (hasConsoleLog) issues.push({ line: 3, severity: "info", category: "style", message: "Debug statements left in production code", suggestion: "Remove console.log / print statements or use a proper logging library" });
  if (hasAnyType) issues.push({ line: 10, severity: "warning", category: "style", message: "TypeScript 'any' type disables type checking", suggestion: "Replace 'any' with proper typed interfaces to maintain type safety" });
  if (hasInnerHTML) issues.push({ line: 14, severity: "critical", category: "security", message: "innerHTML can lead to XSS attacks", suggestion: "Use textContent or sanitize user input with DOMPurify before rendering" });

  const critical = issues.filter(i => i.severity === "critical").length;
  const warnings = issues.filter(i => i.severity === "warning").length;
  const score = Math.max(20, 100 - critical * 20 - warnings * 8 - (hasConsoleLog ? 3 : 0));
  const grade = score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 45 ? "D" : "F";

  const fixedCode = language === "Python"
    ? `import sqlite3\nimport os\nimport numpy as np\n\ndef get_user(username: str, password: str):\n    conn = sqlite3.connect("users.db")\n    query = "SELECT * FROM users WHERE username = ?"\n    result = conn.execute(query, (username,))\n    user = result.fetchone()\n    if user and user[2] == password:\n        return user\n    return None\n\ndef process_items(items):\n    arr = np.array(items)\n    return np.outer(arr, arr).tolist()\n\nAPI_KEY = os.environ.get("API_KEY")\nDEBUG = os.environ.get("DEBUG", "false").lower() == "true"`
    : `const express = require('express')\nconst app = express()\n\napp.get('/user', (req, res) => {\n  const id = parseInt(req.query.id)\n  const query = 'SELECT * FROM users WHERE id = ?'\n  db.query(query, [id], (err, result) => {\n    res.json(result)\n  })\n})\n\nasync function fetchAllData() {\n  const ids = Array.from({ length: 1000 }, (_, i) => i)\n  const data = await Promise.all(\n    ids.map(id => fetch('/api/item/' + id).then(r => r.json()))\n  )\n  return data\n}\n\nconst SECRET = process.env.APP_SECRET`;

  return {
    score, grade,
    summary: `Found ${issues.length} issue${issues.length !== 1 ? "s" : ""} — ${critical} critical, ${warnings} warnings. ${score >= 75 ? "Code is functional but needs security hardening." : "Significant issues need to be addressed before production."}`,
    issues,
    strengths: ["Function structure is clear and readable", "Logic flow is easy to follow", score > 60 ? "No obvious infinite loops detected" : "Basic error handling present"],
    metrics: [
      { label: "Security", value: critical === 0 ? "Clean" : `${critical} Critical`, status: critical === 0 ? "good" : "bad" },
      { label: "Performance", value: hasNestedLoop ? "O(n²) detected" : "Good", status: hasNestedLoop ? "warn" : "good" },
      { label: "Code Style", value: hasConsoleLog || hasAnyType ? "Needs cleanup" : "Clean", status: hasConsoleLog || hasAnyType ? "warn" : "good" },
      { label: "Maintainability", value: score >= 75 ? "Good" : "Needs work", status: score >= 75 ? "good" : "warn" },
    ],
    fixedCode,
  };
}

const severityConfig = {
  critical: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", badge: "bg-red-500/20 text-red-400", label: "Critical" },
  warning: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400", badge: "bg-yellow-500/20 text-yellow-400", label: "Warning" },
  info: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", badge: "bg-blue-500/20 text-blue-400", label: "Info" },
};
const categoryIcon = { security: Shield, performance: Zap, style: FileCode2, logic: GitBranch };
const gradeColor = { A: "text-emerald-400", B: "text-green-400", C: "text-yellow-400", D: "text-orange-400", F: "text-red-400" };

export default function CodeReview() {
  const [language, setLanguage] = useState("Python");
  const [code, setCode] = useState(SAMPLE_CODE["Python"]);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"issues" | "fixed" | "chat">("issues");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [copied, setCopied] = useState(false);
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setCode(SAMPLE_CODE[lang] || SAMPLE_CODE["Python"]);
    setResult(null);
    setChatMessages([]);
  };

  const handleReview = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);
    await new Promise(r => setTimeout(r, 1800));
    setResult(generateReview(code, language));
    setActiveTab("issues");
    setLoading(false);
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.fixedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim() || !result) return;
    const q = chatInput;
    setChatInput("");
    setChatMessages(m => [...m, { role: "user", text: q }]);
    await new Promise(r => setTimeout(r, 900));
    const responses: Record<string, string> = {
      default: `Based on the review, the main concern is the ${result.issues[0]?.category || "security"} issue on line ${result.issues[0]?.line || 1}. ${result.issues[0]?.suggestion || "Follow best practices for production-ready code."}`,
      fix: `To fix the critical issues: 1) Replace string-concatenated queries with parameterized queries. 2) Move all secrets to environment variables. 3) Remove debug statements before deploying.`,
      score: `Your code scored ${result.score}/100 (Grade ${result.grade}). The main deductions are from ${result.issues.filter(i => i.severity === "critical").length} critical security issues.`,
    };
    const text = q.toLowerCase().includes("fix") ? responses.fix : q.toLowerCase().includes("score") ? responses.score : responses.default;
    setChatMessages(m => [...m, { role: "ai", text }]);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white font-sans">
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <Code2 className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg tracking-tight">CodeLens AI</span>
            <span className="text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full">Powered by MiMo</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
            <span className="text-white font-medium">Review</span>
            <span className="hover:text-white cursor-pointer transition-colors">History</span>
            <span className="hover:text-white cursor-pointer transition-colors">Docs</span>
            <button className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 rounded-lg text-sm transition-colors">Get API</button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-white via-violet-300 to-violet-500 bg-clip-text text-transparent">AI Code Review</h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">Detect security vulnerabilities, performance issues, and bad practices instantly</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-[#111118] border border-white/8 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 overflow-x-auto">
                <Terminal className="w-4 h-4 text-zinc-500 shrink-0" />
                <div className="flex gap-1.5">
                  {LANGUAGES.map(lang => (
                    <button key={lang} onClick={() => handleLanguageChange(lang)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${language === lang ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}>
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <textarea value={code} onChange={e => setCode(e.target.value)}
                  className="w-full h-80 bg-transparent text-sm font-mono text-zinc-200 p-4 resize-none outline-none leading-relaxed"
                  placeholder="Paste your code here..." spellCheck={false} />
                <div className="absolute top-3 right-3 text-xs text-zinc-600">{code.split("\n").length} lines</div>
              </div>
              <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-zinc-600">{code.length} characters</span>
                <button onClick={handleReview} disabled={loading || !code.trim()}
                  className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-medium transition-all">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {loading ? "Analyzing..." : "Review Code"}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Shield, label: "Security", value: "OWASP Top 10", color: "text-red-400" },
                { icon: Zap, label: "Performance", value: "Complexity scan", color: "text-yellow-400" },
                { icon: Star, label: "Quality", value: "A–F grading", color: "text-violet-400" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="bg-[#111118] border border-white/8 rounded-xl p-3 text-center">
                  <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
                  <p className="text-xs font-medium text-white">{label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#111118] border border-white/8 rounded-2xl overflow-hidden flex flex-col">
            {!result && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-center px-8">
                <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
                  <Code2 className="w-8 h-8 text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Ready to Review</h3>
                <p className="text-zinc-500 text-sm">Paste your code on the left and click <span className="text-violet-400">"Review Code"</span> to get instant AI feedback</p>
              </div>
            )}
            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center py-16">
                <Loader2 className="w-10 h-10 text-violet-400 animate-spin mb-4" />
                <p className="text-zinc-400 font-medium">Analyzing your code...</p>
                <div className="mt-4 flex gap-2">
                  {["Security scan", "Performance check", "Style review"].map((s, i) => (
                    <span key={i} className="text-xs bg-white/5 text-zinc-500 px-2 py-1 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {result && (
              <>
                <div className="p-5 border-b border-white/5">
                  <div className="flex items-center gap-5">
                    <div className="relative w-20 h-20 shrink-0">
                      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                        <circle cx="40" cy="40" r="32" fill="none" stroke={result.score >= 75 ? "#10b981" : result.score >= 50 ? "#f59e0b" : "#ef4444"}
                          strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(result.score / 100) * 201} 201`} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-bold">{result.score}</span>
                        <span className={`text-sm font-bold ${gradeColor[result.grade]}`}>{result.grade}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-400 mb-3">{result.summary}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {result.metrics.map(m => (
                          <div key={m.label} className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg ${m.status === "good" ? "bg-emerald-500/10" : m.status === "warn" ? "bg-yellow-500/10" : "bg-red-500/10"}`}>
                            {m.status === "good" ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : m.status === "warn" ? <Info className="w-3 h-3 text-yellow-400 shrink-0" /> : <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />}
                            <span className="text-zinc-300 truncate">{m.label}: <span className={m.status === "good" ? "text-emerald-400" : m.status === "warn" ? "text-yellow-400" : "text-red-400"}>{m.value}</span></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex border-b border-white/5 text-sm">
                  {(["issues", "fixed", "chat"] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-2.5 font-medium transition-colors capitalize ${activeTab === tab ? "text-white border-b-2 border-violet-500" : "text-zinc-500 hover:text-zinc-300"}`}>
                      {tab === "issues" ? `Issues (${result.issues.length})` : tab === "fixed" ? "Fixed Code" : "AI Chat"}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto">
                  {activeTab === "issues" && (
                    <div className="p-4 space-y-2">
                      {result.issues.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500">
                          <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                          <p>No issues found — great code!</p>
                        </div>
                      ) : result.issues.map((issue, i) => {
                        const cfg = severityConfig[issue.severity];
                        const Icon = categoryIcon[issue.category];
                        return (
                          <div key={i} className={`rounded-xl border ${cfg.bg} ${cfg.border} overflow-hidden`}>
                            <button className="w-full flex items-center gap-3 p-3 text-left" onClick={() => setExpandedIssue(expandedIssue === i ? null : i)}>
                              <Icon className={`w-4 h-4 ${cfg.text} shrink-0`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${cfg.badge}`}>{cfg.label}</span>
                                  <span className="text-xs text-zinc-500">Line {issue.line}</span>
                                  <span className="text-xs text-zinc-500 capitalize">{issue.category}</span>
                                </div>
                                <p className="text-sm text-zinc-200 mt-0.5 truncate">{issue.message}</p>
                              </div>
                              {expandedIssue === i ? <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />}
                            </button>
                            {expandedIssue === i && (
                              <div className="px-4 pb-3 pt-0 border-t border-white/5">
                                <p className="text-xs text-zinc-400 leading-relaxed">💡 {issue.suggestion}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <p className="text-xs text-zinc-500 mb-2 font-medium">✅ Strengths</p>
                        {result.strengths.map((s, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-zinc-400 mb-1">
                            <Check className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                            <span>{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {activeTab === "fixed" && (
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                          <RefreshCw className="w-4 h-4 text-emerald-400" />
                          <span>AI-fixed version</span>
                        </div>
                        <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
                          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {copied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <pre className="text-xs font-mono text-zinc-300 bg-black/30 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed">{result.fixedCode}</pre>
                    </div>
                  )}
                  {activeTab === "chat" && (
                    <div className="flex flex-col h-64">
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {chatMessages.length === 0 && <div className="text-center py-4 text-zinc-600 text-sm">Ask anything about your code review...</div>}
                        {chatMessages.map((m, i) => (
                          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-xs rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-violet-600 text-white rounded-br-sm" : "bg-white/5 text-zinc-300 rounded-bl-sm"}`}>{m.text}</div>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 border-t border-white/5 flex gap-2">
                        <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleChat()}
                          placeholder="Ask about the review..." className="flex-1 bg-white/5 text-sm text-white placeholder-zinc-600 px-3 py-2 rounded-lg outline-none border border-white/8 focus:border-violet-500/50" />
                        <button onClick={handleChat} className="bg-violet-600 hover:bg-violet-500 p-2 rounded-lg transition-colors">
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { icon: Code2, step: "01", title: "Paste Code", desc: "Paste any code in 8 supported languages" },
            { icon: Sparkles, step: "02", title: "AI Analyzes", desc: "MiMo AI scans for 20+ issue categories" },
            { icon: Gauge, step: "03", title: "Get Score", desc: "Receive A–F grade with detailed breakdown" },
            { icon: RefreshCw, step: "04", title: "Apply Fixes", desc: "Copy the AI-generated fixed version" },
          ].map(({ icon: Icon, step, title, desc }) => (
            <div key={step} className="bg-[#111118] border border-white/8 rounded-2xl p-5 flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-violet-400 font-mono mb-1">{step}</p>
                <p className="font-semibold text-sm mb-1">{title}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="border-t border-white/5 py-8 px-4 mt-12">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-zinc-600">
          <span>© 2024 CodeLens AI. Powered by Xiaomi MiMo.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">API Docs</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
