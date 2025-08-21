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
  Bot,
  Lightbulb
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
  processDocumentAction,
  explainClauseAction,
  askQuestionAction,
} from '@/lib/actions';
import type { ExplainClauseOutput, InteractiveQAOutput, ProcessDocumentOutput } from '@/lib/actions';

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
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentText, setDocumentText] = useState<string>('');
  const [clauses, setClauses] =useState<string[]>([]);
  const [summary, setSummary] = useState<ProcessDocumentOutput['summary'] | null>(null);
  const [clauseExplanations, setClauseExplanations] = useState<Record<number, ExplainClauseOutput>>({});
  const [qaHistory, setQaHistory] = useState<(InteractiveQAOutput & {question: string})[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');

  const [isLoading, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState('summary');
  const [explainingClause, setExplainingClause] = useState<number | null>(null);
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [activeAccordionItem, setActiveAccordionItem] = useState<string | undefined>();

  const { toast } = useToast();

  const handleProcessDocument = () => {
    if (!rawText.trim() && !selectedFile) {
      toast({ title: 'Error', description: 'Please upload a file or paste text.', variant: 'destructive' });
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      } else {
        formData.append('text', rawText);
      }

      const result = await processDocumentAction(formData);

      if (result.success) {
        const { documentText: processedText, summary: summaryData, clauses: parsedClauses } = result.data;
        setDocumentText(processedText);
        setClauses(parsedClauses);
        setSummary(summaryData);
      } else {
        toast({ title: 'Processing Failed', description: result.error, variant: 'destructive' });
      }
    });
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    if(file) {
      setRawText('');
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
  
  const onAccordionValueChange = (value: string) => {
    setActiveAccordionItem(value);
    if(value) {
      const clauseIndex = parseInt(value.split('-')[1]);
      handleExplainClause(clauseIndex);
    }
  };

  const handleReset = () => {
    setDocumentText('');
    setRawText('');
    setSelectedFile(null);
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
              Upload a .pdf file, or paste the document text below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input 
                type="file" 
                accept=".pdf"
                onChange={handleFileChange} 
                disabled={isLoading}
                className="text-sm"
              />
              {selectedFile && <p className="text-sm text-muted-foreground">Selected file: {selectedFile.name}</p>}
              <p className="text-xs text-muted-foreground text-center">OR</p>
            </div>
            <Textarea
              placeholder="Or paste your legal document text here..."
              className="min-h-[200px] md:min-h-[250px] text-sm"
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                if (e.target.value) {
                  setSelectedFile(null);
                }
              }}
              disabled={isLoading}
            />
            <Button
              onClick={handleProcessDocument}
              disabled={isLoading || (!rawText.trim() && !selectedFile)}
              className="w-full"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Analyze Document
            </Button>
            <div className="flex items-start md:items-center gap-2 text-xs text-muted-foreground p-2 border rounded-md">
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5 md:mt-0" />
                <span>
                    <strong>Privacy Assurance:</strong> Your documents are processed in-memory and are not stored. We respect your privacy and confidentiality.
                </span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="w-full max-w-5xl animate-fade-in">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col-reverse md:flex-row justify-between md:items-center gap-4 mb-4">
              <TabsList className="grid w-full grid-cols-3 md:w-auto">
                <TabsTrigger value="summary"><BookText className="mr-2 h-4 w-4"/>Summary</TabsTrigger>
                <TabsTrigger value="clauses"><ChevronDown className="mr-2 h-4 w-4"/>Clauses</TabsTrigger>
                <TabsTrigger value="qa"><MessageSquare className="mr-2 h-4 w-4"/>Q&A</TabsTrigger>
              </TabsList>
              <Button variant="outline" onClick={handleReset} className='w-full md:w-auto'>Start Over</Button>
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
                  <Accordion 
                    type="single" 
                    collapsible 
                    className="w-full"
                    value={activeAccordionItem}
                    onValueChange={onAccordionValueChange}>
                    {clauses.map((clause, index) => (
                      <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger>
                          <span className="text-left">Clause {index + 1}</span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          <p className="text-sm text-muted-foreground italic bg-muted p-3 rounded-md">{clause}</p>
                          {explainingClause === index ? (
                            <div className="flex items-center text-sm text-primary"><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Generating explanation...</div>
                          ) : clauseExplanations[index] ? (
                            <>
                              <div className="space-y-3 p-3 border-l-4 border-primary/50 rounded-r-md bg-card">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-semibold text-foreground flex-1 pr-2">Simplified Explanation</h4>
                                  <Badge className={cn('text-xs whitespace-nowrap', riskConfig[clauseExplanations[index].riskScore as RiskScore]?.className)}>
                                    {riskConfig[clauseExplanations[index].riskScore as RiskScore]?.text}
                                  </Badge>
                                </div>
                                <p className="text-sm">{clauseExplanations[index].explanation}</p>
                              </div>
                              {clauseExplanations[index].negotiationSuggestions && clauseExplanations[index].negotiationSuggestions.length > 0 && (
                                <div className="space-y-3 p-3 border-l-4 border-accent rounded-r-md bg-card">
                                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                                    <Lightbulb className="h-5 w-5 text-accent"/>
                                    Actionable Suggestions
                                  </h4>
                                  <ul className="list-disc pl-5 space-y-2 text-sm">
                                    {clauseExplanations[index].negotiationSuggestions.map((suggestion, i) => (
                                      <li key={i}>{suggestion}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </>
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
                  <CardTitle>Interactive Q&A</CardTitle>
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
                                            <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-[80%] md:max-w-lg">
                                                <p className="text-sm font-semibold">You</p>
                                                <p className="text-sm">{qa.question}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-start">
                                            <div className="bg-muted p-3 rounded-lg max-w-[80%] md:max-w-lg flex gap-3">
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
