"use client";

import { useState, useTransition, useEffect } from 'react';
import {
  FileUp,
  Loader2,
  Sparkles,
  BookText,
  MessageSquare,
  ChevronDown,
  Info,
  Lightbulb,
  Copy,
  Check,
  Users,
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
  summarizeDocumentAction
} from '@/lib/actions';
import type { ExplainClauseOutput, InteractiveQAOutput, ProcessDocumentOutput, SmartSummarizationOutput } from '@/lib/actions';

type RiskScore = 'Low' | 'Medium' | 'High';

const riskConfig: Record<RiskScore, { className: string; text: string }> = {
  Low: {
    className: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-100 dark:border-emerald-700',
    text: 'Low Risk',
  },
  Medium: {
    className: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/50 dark:text-amber-100 dark:border-amber-700',
    text: 'Medium Risk',
  },
  High: {
    className: 'bg-red-100 text-red-900 border-red-300 dark:bg-red-900/50 dark:text-red-100 dark:border-red-700',
    text: 'High Risk',
  },
};

const renderWithMarkdown = (text: string) => {
    if (!text) return null;
    // split by bold markdown
    const parts = text.split(/(\*\*.*?\*\*)/g).filter(part => part);

    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        // Then split by newlines to preserve paragraphs
        return part.split(/(\n)/g).map((line, j) => {
            if (line === '\n') {
                return <br key={`${i}-${j}`} />;
            }
            return line;
        });
    });
};

type AnalysisState = 'initial' | 'processing' | 'selecting_role' | 'analyzing' | 'complete';

export default function NyayaSaarathi() {
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentText, setDocumentText] = useState<string>('');
  const [clauses, setClauses] = useState<string[]>([]);
  const [summary, setSummary] = useState<SmartSummarizationOutput | null>(null);
  const [clauseExplanations, setClauseExplanations] = useState<Record<number, ExplainClauseOutput>>({});
  const [qaHistory, setQaHistory] = useState<(InteractiveQAOutput & {question: string})[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [parties, setParties] = useState<[string, string] | null>(null);
  const [analysisState, setAnalysisState] = useState<AnalysisState>('initial');
  const [isMounted, setIsMounted] = useState(false);

  const [isLoading, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState('summary');
  const [explainingClause, setExplainingClause] = useState<number | null>(null);
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [activeAccordionItem, setActiveAccordionItem] = useState<string | undefined>();

  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleProcessDocument = () => {
    if (!rawText.trim() && !selectedFile) {
      toast({ title: 'Error', description: 'Please upload a file or paste text.', variant: 'destructive' });
      return;
    }
    
    setAnalysisState('processing');
    startTransition(async () => {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      } else {
        formData.append('text', rawText);
      }

      const result = await processDocumentAction(formData);

      if (result.success) {
        const { documentText: processedText, clauses: parsedClauses, parties: identifiedParties } = result.data;
        setDocumentText(processedText);
        setClauses(parsedClauses);
        setParties([identifiedParties.partyOne, identifiedParties.partyTwo]);
        setAnalysisState('selecting_role');
      } else {
        toast({ title: 'Processing Failed', description: result.error, variant: 'destructive' });
        setAnalysisState('initial');
      }
    });
  };

  const handleSelectRole = (role: string | null) => {
    setUserRole(role);
    setAnalysisState('analyzing');
    startTransition(async () => {
        const result = await summarizeDocumentAction({documentText, userRole: role || undefined });
        if(result.success) {
            setSummary(result.data);
            setClauseExplanations({});
            setQaHistory([]);
            setActiveTab('summary');
            setAnalysisState('complete');
        } else {
            toast({ title: 'Analysis Failed', description: result.error, variant: 'destructive' });
            setAnalysisState('selecting_role');
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
    if (!clause || clauseExplanations[clauseIndex] || !userRole) return;

    setExplainingClause(clauseIndex);
    const result = await explainClauseAction({ clause, userRole });
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
    const result = await askQuestionAction({ documentContent: documentText, question: questionToAsk, userRole: userRole || undefined });
    
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
    setUserRole(null);
    setParties(null);
    setAnalysisState('initial');
  };

  const handleCopySummary = () => {
    if (summary?.summary) {
      navigator.clipboard.writeText(summary.summary);
      setIsCopied(true);
      toast({title: 'Copied!', description: 'Summary has been copied to your clipboard.'});
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const isProcessing = analysisState === 'processing' || analysisState === 'analyzing' || !isMounted;

  const renderCurrentState = () => {
    switch(analysisState) {
        case 'initial':
            return (
                <Card className="w-full max-w-3xl shadow-lg border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileUp className="h-6 w-6" />
                    Upload or Paste Document
                  </CardTitle>
                  <CardDescription>
                    Upload a .pdf file, or paste the document text below to begin.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Input 
                      type="file" 
                      accept=".pdf"
                      onChange={handleFileChange} 
                      disabled={isProcessing || !!rawText.trim()}
                      className="text-sm file:text-sm file:font-medium file:text-primary file:bg-primary/10 hover:file:bg-primary/20"
                    />
                    {selectedFile && <p className="text-sm text-muted-foreground break-all">Selected file: {selectedFile.name}</p>}
                  </div>
                  
                  <div className="relative">
                      <p className="text-xs text-muted-foreground font-semibold text-center absolute -top-2.5 left-1/2 -translate-x-1/2 bg-card px-2">OR</p>
                      <div className='border-t'></div>
                  </div>
                  <Textarea
                    placeholder="Or paste your legal document text here..."
                    className="min-h-[200px] md:min-h-[250px] text-sm focus:ring-primary/50"
                    value={rawText}
                    onChange={(e) => {
                      setRawText(e.target.value);
                      if (e.target.value) {
                        setSelectedFile(null);
                      }
                    }}
                    disabled={isProcessing || !!selectedFile}
                  />
                  <Button
                    onClick={handleProcessDocument}
                    disabled={isProcessing || (!rawText.trim() && !selectedFile)}
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Analyze Document
                  </Button>
                  <div className="flex items-start gap-3 text-xs text-muted-foreground p-3 border border-dashed rounded-lg md:items-center">
                      <Info className="h-4 w-4 flex-shrink-0 mt-0.5 md:mt-0 text-primary" />
                      <span>
                          <strong>Privacy Assurance:</strong> Your documents are processed in-memory and are not stored. We respect your privacy and confidentiality.
                      </span>
                  </div>
                </CardContent>
              </Card>
            );
        case 'processing':
        case 'analyzing':
            return (
                <Card className="w-full max-w-3xl flex flex-col items-center justify-center p-8 gap-4 shadow-lg border-border/60">
                   <Loader2 className="h-12 w-12 animate-spin text-primary" />
                   <div className='text-center'>
                       <p className="text-lg font-semibold">{analysisState === 'processing' ? 'Processing Document...' : 'Analyzing Perspective...'}</p>
                       <p className="text-muted-foreground">The AI is hard at work. This may take a moment.</p>
                   </div>
                </Card>
           );
        case 'selecting_role':
            return (
                <Card className="w-full max-w-3xl shadow-lg border-border/60">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-6 w-6" />
                        Select Your Perspective
                      </CardTitle>
                      <CardDescription>
                        We've identified the parties below. Choose a side to tailor the analysis to your specific role, or proceed with a neutral overview.
                      </CardDescription>
                    </CardHeader>
                    {parties && (
                        <CardContent className='flex flex-col gap-3'>
                            <Button onClick={() => handleSelectRole(parties[0])} size="lg" variant="outline" className="justify-start">{parties[0]}</Button>
                            <Button onClick={() => handleSelectRole(parties[1])} size="lg" variant="outline" className="justify-start">{parties[1]}</Button>
                            <div className="relative my-1">
                                <p className="text-xs text-muted-foreground font-semibold text-center absolute -top-2.5 left-1/2 -translate-x-1/2 bg-card px-2">OR</p>
                                <div className='border-t'></div>
                            </div>
                            <Button onClick={() => handleSelectRole(null)} size="lg" variant="outline" className="justify-start">Neutral Analysis</Button>
                        </CardContent>
                    )}
                </Card>
            );
        case 'complete':
            return (
                <div className="w-full max-w-5xl">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <div className="flex flex-col-reverse justify-between items-center gap-4 mb-4 md:flex-row">
                        <TabsList className="grid w-full grid-cols-3 md:w-auto shadow-inner bg-muted">
                          <TabsTrigger value="summary"><BookText className="mr-2 h-4 w-4"/>Summary</TabsTrigger>
                          <TabsTrigger value="clauses"><ChevronDown className="mr-2 h-4 w-4"/>Clauses</TabsTrigger>
                          <TabsTrigger value="qa"><MessageSquare className="mr-2 h-4 w-4"/>Q&amp;A</TabsTrigger>
                        </TabsList>
                        <Button variant="outline" onClick={handleReset} className='w-full md:w-auto'>Start Over</Button>
                      </div>
          
                      <TabsContent value="summary">
                        <Card className="shadow-md border-border/60">
                          <CardHeader className="flex flex-row items-start justify-between">
                            <div>
                              <CardTitle>Document Summary</CardTitle>
                              <CardDescription>
                                An AI-generated overview from the perspective of {renderWithMarkdown(`**${userRole || 'a neutral party'}**`)}.
                              </CardDescription>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleCopySummary} disabled={isCopied}>
                              {isCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                              <span className="sr-only">{isCopied ? 'Copied' : 'Copy'}</span>
                            </Button>
                          </CardHeader>
                          <CardContent>
                            {summary ? (
                              <div className="text-sm whitespace-pre-wrap leading-relaxed">{renderWithMarkdown(summary?.summary)}</div>
                            ) : (
                               <div className="space-y-2">
                                  <Skeleton className="h-4 w-full" />
                                  <Skeleton className="h-4 w-full" />
                                  <Skeleton className="h-4 w-3/4" />
                               </div>
                            )}
                          </CardContent>
                        </Card>
                      </TabsContent>
          
                      <TabsContent value="clauses">
                        <Card className="shadow-md border-border/60">
                          <CardHeader>
                            <CardTitle>Clause Explanations</CardTitle>
                            <CardDescription>Click on each clause to get a simple explanation and risk assessment from your perspective.</CardDescription>
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
                                  <AccordionTrigger className="text-left hover:no-underline">
                                    <span className="flex-1 text-left font-semibold">Clause {index + 1}</span>
                                  </AccordionTrigger>
                                  <AccordionContent className="space-y-4">
                                    <p className="text-sm text-muted-foreground italic bg-secondary p-4 rounded-md shadow-inner">{clause}</p>
                                    {explainingClause === index ? (
                                      <div className="flex items-center text-sm text-primary"><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Generating explanation...</div>
                                    ) : clauseExplanations[index] ? (
                                      <>
                                        <div className="space-y-3 p-4 border rounded-md shadow-sm">
                                          <div className="flex justify-between items-start">
                                            <h4 className="font-semibold text-foreground flex-1 pr-2">Simplified Explanation</h4>
                                            <Badge variant="outline" className={cn('text-xs whitespace-nowrap', riskConfig[clauseExplanations[index].riskScore as RiskScore]?.className)}>
                                              {riskConfig[clauseExplanations[index].riskScore as RiskScore]?.text}
                                            </Badge>
                                          </div>
                                          <p className="text-sm">{clauseExplanations[index].explanation}</p>
                                        </div>
                                        {clauseExplanations[index].negotiationSuggestions && clauseExplanations[index].negotiationSuggestions.length > 0 && (
                                          <div className="space-y-3 p-4 border-l-4 border-primary rounded-r-md bg-card shadow-sm">
                                            <h4 className="font-semibold text-foreground flex items-center gap-2">
                                              <Lightbulb className="h-5 w-5 text-primary"/>
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
                        <Card className="shadow-md border-border/60">
                          <CardHeader>
                            <CardTitle>Interactive Q&amp;A</CardTitle>
                            <CardDescription>Ask a question about the document in plain language.</CardDescription>
                          </CardHeader>
                          <CardContent>
                              <div className="flex flex-col h-[500px]">
                                  <ScrollArea className="flex-grow p-4 border rounded-t-md mb-0 bg-muted/30">
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
                                                      <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-[80%] shadow">
                                                          <p className="text-sm">{qa.question}</p>
                                                      </div>
                                                  </div>
                                                  <div className="flex justify-start">
                                                      <div className="bg-card text-card-foreground p-3 rounded-lg max-w-[80%] border shadow">
                                                          <div className="text-sm whitespace-pre-wrap">{renderWithMarkdown(qa.answer)}</div>
                                                      </div>
                                                  </div>
                                              </div>
                                          ))}
                                          {askingQuestion && <div className="flex justify-start"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>}
                                      </div>
                                  </ScrollArea>
                                  <form onSubmit={handleAskQuestion} className="flex gap-0 border rounded-b-md border-t-0 p-2 bg-card">
                                      <Input
                                      value={currentQuestion}
                                      onChange={(e) => setCurrentQuestion(e.target.value)}
                                      placeholder="e.g., What is the termination clause?"
                                      disabled={askingQuestion}
                                      className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                      />
                                      <Button type="submit" disabled={askingQuestion || !currentQuestion.trim()}>
                                          {askingQuestion ? <Loader2 className="h-4 w-4 animate-spin"/> : "Ask"}
                                      </Button>
                                  </form>
                              </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                </div>
            )
    }
  }

  return (
    <div className="flex flex-col items-center w-full min-h-screen p-4 md:p-8 bg-background">
      <div className="flex flex-col items-center w-full max-w-5xl">
        <header className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Logo className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            NyayaSaarathi
          </h1>
        </header>
        <p className="text-muted-foreground mb-8 max-w-2xl text-center">
          Break down complex legal documents into simple, understandable language. Upload your document to get started.
        </p>
        
        <div className="w-full animate-fade-in flex justify-center">
          {renderCurrentState()}
        </div>
      </div>
    </div>
  );
}
