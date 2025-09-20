
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, FileUp, Lock, MessageSquare, Shield, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/icons';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Logo className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            VakilSaab
          </h1>
        </div>
        <Button asChild>
          <Link href="/tool">Get Started</Link>
        </Button>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-secondary/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
              Demystify Legal Documents in Seconds
            </h2>
            <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground">
              VakilSaab uses AI to translate complex legal jargon into simple, understandable language. Get summaries, clause explanations, and answers, all from your perspective.
            </p>
            <div className="mt-10">
              <Button asChild size="lg" className="shadow-lg">
                <Link href="/tool">
                  <Sparkles className="mr-2" />
                  Analyze Your Document for Free
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold">Understand, Don't Just Sign</h3>
              <p className="mt-2 text-muted-foreground">Everything you need for legal clarity.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="mt-4">AI-Powered Summaries</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Get a concise, AI-generated overview of your document, highlighting key terms and obligations from your point of view.</p>
                </CardContent>
              </Card>
              <Card className="text-center shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                    <CheckCircle className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="mt-4">Clause Explanations</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Dive into any clause for a simple explanation, risk assessment, and actionable negotiation suggestions.</p>
                </CardContent>
              </Card>
              <Card className="text-center shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="mt-4">Interactive Q&A</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Ask questions about the document in plain language and get clear, context-aware answers instantly.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-secondary/50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h3 className="text-3xl font-bold">Get Clarity in 3 Simple Steps</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold shadow-lg">1</div>
                        <h4 className="mt-6 text-xl font-semibold">Upload Document</h4>
                        <p className="mt-2 text-muted-foreground">Securely upload or paste the text of your legal document.</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold shadow-lg">2</div>
                        <h4 className="mt-6 text-xl font-semibold">Select Your Role</h4>
                        <p className="mt-2 text-muted-foreground">Choose your perspective (e.g., Tenant, Employee) for tailored analysis.</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold shadow-lg">3</div>
                        <h4 className="mt-6 text-xl font-semibold">Receive Insights</h4>
                        <p className="mt-2 text-muted-foreground">Get an instant breakdown, summaries, and answers.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* Privacy Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
                <div className="mx-auto bg-emerald-100 dark:bg-emerald-900/50 p-3 rounded-full w-fit">
                    <Lock className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
              <h3 className="mt-6 text-3xl font-bold">Your Privacy is Our Priority</h3>
              <p className="mt-4 text-lg text-muted-foreground">
                We take your confidentiality seriously. Your documents are processed in-memory and are never stored on our servers. The analysis is performed securely, and your data is erased immediately after you close the session.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 bg-secondary/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} VakilSaab. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
