// src/app/admin/report/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

// Define the types for our data objects
interface Report {
  id: string;
  start_date: string;
  end_date: string;
  total_revenue: number;
  new_rental_revenue: number;
  extension_revenue: number;
  total_transactions: number;
  new_rentals: number;
  busiest_day: string;
  new_user_signups: number;
}
interface ReportOption {
  id: string;
  start_date: string;
  end_date: string;
}
interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

// A component to safely render Markdown-like text from the AI
const MarkdownRenderer = ({ text }: { text: string }) => {
  // This converts **text** to <strong>text</strong> and newlines to <br> tags
  const createMarkup = () => {
    const html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />');
    return { __html: html };
  };

  return <p className="text-sm text-blue-700 whitespace-pre-wrap" dangerouslySetInnerHTML={createMarkup()} />;
};


export default function ReportPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [availableReports, setAvailableReports] = useState<ReportOption[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for the AI Assistant
  const [aiSummary, setAiSummary] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Fetches the list of reports and the details of the selected report
  useEffect(() => {
    const fetchReportData = async () => {
      if (!selectedReportId) return;
      setLoading(true);
      setError(null);
      setAiSummary('');
      setChatMessages([]);
      try {
        const { data, error: fetchError } = await supabase.from('weekly_reports').select('*').eq('id', selectedReportId).single();
        if (fetchError) throw fetchError;
        setReport(data);
      } catch (err) {
        if (err instanceof Error) setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [selectedReportId]);

  // Fetches the initial list of available reports
  useEffect(() => {
    const fetchReportList = async () => {
      const { data } = await supabase.rpc('get_available_reports');
      if (data && data.length > 0) {
        setAvailableReports(data);
        setSelectedReportId(data[0].id);
      } else {
        setLoading(false);
      }
    };
    fetchReportList();
  }, []);

  // Automatically gets the AI summary when a new report is loaded
  useEffect(() => {
    if (!report) return;
    const getAiSummary = async () => {
      setIsAiLoading(true);
      try {
        const res = await fetch('/api/report-ai', {
          method: 'POST',
          body: JSON.stringify({
            reportData: report,
            messages: [{ role: 'user', content: 'Please provide a concise summary of this weekly report with one key recommendation.' }]
          }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setAiSummary(data.reply);
      } catch (err) {
        if (err instanceof Error) setAiSummary(`Error generating summary: ${err.message}`);
      } finally {
        setIsAiLoading(false);
      }
    };
    getAiSummary();
  }, [report]);

  // Handles sending a chat message
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isAiLoading) return;

    const newUserMessage: ChatMessage = { role: 'user', content: userInput };
    const newMessages = [...chatMessages, newUserMessage];
    setChatMessages(newMessages);
    setUserInput('');
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/report-ai', {
        method: 'POST',
        body: JSON.stringify({ reportData: report, messages: newMessages }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setChatMessages(prev => [...prev, { role: 'model', content: data.reply }]);
    } catch (err) {
      if (err instanceof Error) {
        setChatMessages(prev => [...prev, { role: 'model', content: `Sorry, an error occurred: ${err.message}` }]);
      }
    } finally {
      setIsAiLoading(false);
    }
  };
  
  // Auto-scroll chat area
  useEffect(() => {
    chatAreaRef.current?.scrollTo({ top: chatAreaRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMessages, isAiLoading]);

  // This is the fully implemented renderMetric function
  const renderMetric = (label: string, value: string | number | null | undefined) => (
    <div className="flex justify-between items-center py-3 border-b border-gray-200">
      <p className="text-gray-600">{label}</p>
      <p className="font-semibold text-gray-900">{value ?? 'N/A'}</p>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Performance Reports</h1>
        <div>
          <select
            value={selectedReportId}
            onChange={(e) => setSelectedReportId(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
            disabled={availableReports.length === 0}
          >
            {availableReports.map(r => (<option key={r.id} value={r.id}>Week of {formatDate(r.start_date)}</option>))}
          </select>
        </div>
      </div>

      {loading && <div>Loading report...</div>}
      {error && <div className="text-red-500 p-4 bg-red-50 rounded-md">Error: {error}</div>}
      
      {!loading && !report && <div className="p-4 text-center">No weekly reports have been generated yet.</div>}

      {report && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: The Data Report */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-700 border-b pb-4 mb-4">Report for {formatDate(report.start_date)} - {formatDate(report.end_date)}</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Financial Performance</h3>
                {renderMetric("Total Revenue", `$${report.total_revenue.toFixed(2)}`)}
                {renderMetric("Revenue from New Rentals", `$${report.new_rental_revenue.toFixed(2)}`)}
                {renderMetric("Revenue from Extensions", `$${report.extension_revenue.toFixed(2)}`)}
                {renderMetric("Total Transactions", report.total_transactions)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Operational Metrics</h3>
                {renderMetric("New Rentals", report.new_rentals)}
                {renderMetric("Busiest Day", report.busiest_day)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Customer Growth</h3>
                {renderMetric("New User Signups", report.new_user_signups)}
              </div>
            </div>
          </div>

          {/* Right Column: AI Assistant */}
          <div className="bg-white p-6 rounded-lg shadow flex flex-col">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">AI Analyst Assistant</h2>
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">AI Summary & Recommendations</h3>
              {isAiLoading && !aiSummary ? <p className="text-sm text-blue-700 animate-pulse">Generating analysis...</p> : <MarkdownRenderer text={aiSummary} />}
            </div>
            <div className="flex-grow flex flex-col">
              <h3 className="font-semibold text-gray-800 mb-2">Ask a follow-up question</h3>
              <div ref={chatAreaRef} className="flex-grow border rounded-md p-4 h-64 overflow-y-auto bg-gray-50 space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-sm px-3 py-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                      <p className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }} />
                    </div>
                  </div>
                ))}
                {isAiLoading && chatMessages.length > 0 && <div className="flex justify-start"><div className="px-3 py-2 rounded-lg bg-gray-200 text-gray-800 animate-pulse">...</div></div>}
              </div>
              <form onSubmit={handleChatSubmit} className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Ask about the report..."
                  className="flex-grow p-2 border border-gray-300 rounded-md"
                  disabled={isAiLoading}
                />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md disabled:bg-gray-400" disabled={isAiLoading}>Send</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
