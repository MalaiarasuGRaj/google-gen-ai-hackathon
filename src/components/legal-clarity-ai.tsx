"use client";

import { useState, useTransition } from 'react';
import {
  FileUp,
  Loader2,
  Sparkles,
  BookText,
  MessageSquare,
  ChevronDown,
  Info,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/icons';
import { cn } from '@/lib/utils';
import {
  generateSummaryAction,
  explainClauseAction,
  askQuestionAction,
} from '@/lib/actions';
import type { ExplainClauseOutput, InteractiveQAOutput, SmartSummarizationOutput } from '@/lib/actions';

type RiskScore = 'Low' | 'Medium' | 'High';

const riskConfig: Record<RiskScore, { className: string; text: string }> = {
  Low: {
    className: 'bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-100 dark:border-emerald-800',
    text: 'Low Risk',
  },
  Medium: {
    className: 'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900/50 dark:text-amber-100 dark:border-amber-800',
    text: 'Medium Risk',
  },
  High: {
    className: 'bg-red-100 text-red-900 border-red-200 dark:bg-red-900/50 dark:text-red-100 dark:border-red-800',
    text: 'High Risk',
  },
};

export default function LegalClarityAI() {
  const [documentText, setDocumentText] = useState<string>('');
  const [clauses, setClauses] =useState<string[]>([]);
  const [summary, setSummary] = useState<SmartSummarizationOutput | null>(null);
  const [clauseExplanations, setClauseExplanations] = useState<Record<number, ExplainClauseOutput>>({});
  const [qaHistory, setQaHistory] = useState<InteractiveQAOutput[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');

  const [isLoading, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState('summary');
  const [explainingClause, setExplainingClause] = useState<number | null>(null);
  const [askingQuestion, setAskingQuestion] = useState(false);

  const { toast } = useToast();

  const handleProcessDocument = (text: string) => {
    if (!text.trim()) {
      toast({ title: 'Error', description: 'Document text cannot be empty.', variant: 'destructive' });
      return;
    }

    startTransition(async () => {
      setDocumentText(text);
      const parsedClauses = text.split(/\n\s*\n/).filter(p => p.trim() !== '');
      setClauses(parsedClauses);
      
      const result = await generateSummaryAction({ documentText: text });
      if (result.success) {
        setSummary(result.data);
      } else {
        toast({ title: 'Summarization Failed', description: result.error, variant: 'destructive' });
      }
    });
  };
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/plain') {
        const text = await file.text();
        handleProcessDocument(text);
      } else {
        toast({
          title: "Unsupported File Type",
          description: "Please upload a .txt file. PDF and DOCX support is coming soon.",
          variant: "destructive",
        });
      }
      event.target.value = '';
    }
  };

  const handleExplainClause = async (clauseIndex: number) => {
    const clause = clauses[clauseIndex];
    if (!clause || clauseExplanations[clauseIndex]) return;

    setExplainingClause(clauseIndex);
    const result = await explainClauseAction({ clause });
    if (result.success) {
      setClauseExplanations(prev => ({ ...prev, [clauseIndex]: result.data }));
    } else {
      toast({ title: 'Explanation Failed', description: result.error, variant: 'destructive' });
    }
    setExplainingClause(null);
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion.trim()) return;

    setAskingQuestion(true);
    const questionToAsk = currentQuestion;
    setCurrentQuestion('');
    const result = await askQuestionAction({ documentContent: documentText, question: questionToAsk });
    
    if (result.success) {
      setQaHistory(prev => [...prev, { question: questionToAsk, ...result.data }]);
    } else {
      toast({ title: 'Q&A Failed', description: result.error, variant: 'destructive' });
    }
    setAskingQuestion(false);
  };

  const handleReset = () => {
    setDocumentText('');
    setClauses([]);
    setSummary(null);
    setClauseExplanations({});
    setQaHistory([]);
    setCurrentQuestion('');
    setActiveTab('summary');
  };

  return (
    <div className="flex flex-col items-center w-full">
      <header className="flex items-center gap-2 mb-4">
        <Logo className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Legal Clarity AI
        </h1>
      </header>
      <p className="text-muted-foreground mb-8 max-w-2xl text-center">
        Break down complex legal documents into simple, understandable language. Upload your document or paste the text to get started.
      </p>

      {!documentText ? (
        <Card className="w-full max-w-3xl animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileUp className="h-6 w-6" />
              Upload or Paste Document
            </CardTitle>
            <CardDescription>
              Upload a .txt file or paste the document text below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input type="file" accept=".txt" onChange={handleFileUpload} disabled={isLoading} />
              <p className="text-xs text-muted-foreground text-center">OR</p>
            </div>
            <Textarea
              placeholder="Paste your legal document text here..."
              className="min-h-[250px] text-sm"
              id="doc-text"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleProcessDocument((document.getElementById('doc-text') as HTMLTextAreaElement)?.value)}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Analyze Document
            </Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 border rounded-md">
                <Info className="h-4 w-4 flex-shrink-0" />
                <span>
                    <strong>Privacy Assurance:</strong> Your documents are processed in-memory and are not stored. We respect your privacy and confidentiality.
                </span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="w-full max-w-5xl animate-fade-in">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="summary"><BookText className="mr-2 h-4 w-4"/>Summary</TabsTrigger>
                <TabsTrigger value="clauses"><ChevronDown className="mr-2 h-4 w-4"/>Clauses</TabsTrigger>
                <TabsTrigger value="qa"><MessageSquare className="mr-2 h-4 w-4"/>Q&amp;A</TabsTrigger>
              </TabsList>
              <Button variant="outline" onClick={handleReset}>Start Over</Button>
            </div>

            <TabsContent value="summary">
              <Card>
                <CardHeader>
                  <CardTitle>Document Summary</CardTitle>
                  <CardDescription>An AI-generated overview of the key terms and obligations.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading && !summary ? (
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                     </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{summary?.summary}</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="clauses">
              <Card>
                <CardHeader>
                  <CardTitle>Clause Explanations</CardTitle>
                  <CardDescription>Click on each clause to get a simple explanation and risk assessment.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {clauses.map((clause, index) => (
                      <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger onOpening={() => handleExplainClause(index)}>
                          <span className="text-left">Clause {index + 1}</span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          <p className="text-sm text-muted-foreground italic bg-muted p-3 rounded-md">{clause}</p>
                          {explainingClause === index ? (
                            <div className="flex items-center text-sm text-primary"><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Generating explanation...</div>
                          ) : clauseExplanations[index] ? (
                            <div className="space-y-3 p-3 border-l-4 border-accent rounded-r-md bg-card">
                              <div className="flex justify-between items-center">
                                <h4 className="font-semibold text-foreground">Simplified Explanation</h4>
                                <Badge className={cn('text-xs', riskConfig[clauseExplanations[index].riskScore as RiskScore]?.className)}>
                                  {riskConfig[clauseExplanations[index].riskScore as RiskScore]?.text}
                                </Badge>
                              </div>
                              <p className="text-sm">{clauseExplanations[index].explanation}</p>
                            </div>
                          ) : null}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="qa">
              <Card>
                <CardHeader>
                  <CardTitle>Interactive Q&amp;A</CardTitle>
                  <CardDescription>Ask a question about the document in plain language.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col h-[500px]">
                        <ScrollArea className="flex-grow p-4 border rounded-md mb-4">
                            {qaHistory.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                    <MessageSquare className="h-10 w-10 mb-2"/>
                                    <p>Ask a question to get started.</p>
                                </div>
                            )}
                            <div className="space-y-4">
                                {qaHistory.map((qa, index) => (
                                    <div key={index} className="space-y-4">
                                        <div className="flex justify-end">
                                            <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-lg">
                                                <p className="text-sm font-semibold">You</p>
                                                <p className="text-sm">{qa.question}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-start">
                                            <div className="bg-muted p-3 rounded-lg max-w-lg flex gap-3">
                                                <div className="bg-background rounded-full h-8 w-8 flex-shrink-0 flex items-center justify-center">
                                                    <Bot className="h-5 w-5 text-primary"/>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold">AI Assistant</p>
                                                    <p className="text-sm">{qa.answer}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {askingQuestion && <div className="flex justify-start"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>}
                            </div>
                        </ScrollArea>
                        <form onSubmit={handleAskQuestion} className="flex gap-2">
                            <Input
                            value={currentQuestion}
                            onChange={(e) => setCurrentQuestion(e.target.value)}
                            placeholder="e.g., What is the termination clause?"
                            disabled={askingQuestion}
                            />
                            <Button type="submit" disabled={askingQuestion || !currentQuestion.trim()}>
                                {askingQuestion ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                Ask
                            </Button>
                        </form>
                    </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}