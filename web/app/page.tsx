import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  BookOpen,
  Layers,
  GitMerge,
  Quote,
  CheckCircle2,
  Microscope,
} from "lucide-react";

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-background overflow-hidden">
      {/* ── Ambient background ── */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute top-0 right-0 w-[800px] h-[600px] rounded-full blur-3xl -translate-y-1/4 translate-x-1/4"
          style={{
            backgroundColor:
              "color-mix(in oklch, var(--color-primary) 6%, transparent)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-[600px] h-[500px] rounded-full blur-3xl translate-y-1/4 -translate-x-1/4"
          style={{
            backgroundColor:
              "color-mix(in oklch, var(--color-accent) 8%, transparent)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Microscope className="w-4 h-4 text-primary-foreground" />
          </div>
          <span
            className="text-xl font-semibold tracking-tight text-foreground"
            style={{ fontFamily: "var(--font-crimson)" }}
          >
            ScholarAI
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm" className="gap-1.5">
              Get started
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-8 pt-20 pb-16">
        <div className="max-w-4xl">
          <Badge
            variant="secondary"
            className="mb-6 gap-1.5 px-3 py-1 text-xs font-medium"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
            Built for researchers, not students
          </Badge>

          <h1
            className="text-6xl md:text-7xl lg:text-[82px] font-light leading-[0.95] tracking-tight mb-8 text-foreground"
            style={{ fontFamily: "var(--font-crimson)" }}
          >
            Your literature
            <br />
            review,{" "}
            <span className="relative">
              <em className="not-italic text-primary">accelerated.</em>
              {/* Underline accent */}
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent/60 rounded-full" />
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            Upload a batch of research papers. Ask ScholarAI to synthesize
            findings, compare methodologies, and surface contradictions — with
            every claim cited back to the source paper and page.
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            <Link href="/sign-up">
              <Button size="lg" className="h-12 px-7 text-base gap-2">
                Start your review
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-7 text-base"
              >
                Sign in
              </Button>
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-6 mt-8 flex-wrap">
            {[
              "No credit card required",
              "Runs locally with Ollama",
              "Your papers stay private",
            ].map((item) => (
              <span
                key={item}
                className="flex items-center gap-1.5 text-sm text-muted-foreground"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-primary/60" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="max-w-6xl mx-auto px-8 py-16">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            How it works
          </p>
          <h2
            className="text-3xl font-light text-foreground"
            style={{ fontFamily: "var(--font-crimson)" }}
          >
            From papers to insights in minutes
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              step: "01",
              icon: Layers,
              title: "Create a project",
              description:
                "Group your papers into a research project — e.g. 'Transformer Architectures Survey'. Upload 5–10 PDFs in one go.",
            },
            {
              step: "02",
              icon: GitMerge,
              title: "AI indexes everything",
              description:
                "ScholarAI reads every paper, chunks the content, and builds a semantic index. Each chunk is tagged with its paper title and authors.",
            },
            {
              step: "03",
              icon: Quote,
              title: "Synthesize with citations",
              description:
                "Ask anything. Get answers that compare across papers, identify contradictions, and cite the exact paper and page number.",
            },
          ].map(({ step, icon: Icon, title, description }) => (
            <div
              key={step}
              className="relative rounded-xl border border-border bg-card/70 backdrop-blur-sm p-6 hover:border-primary/30 hover:shadow-sm transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span
                  className="text-4xl font-light text-muted-foreground/20 leading-none"
                  style={{ fontFamily: "var(--font-crimson)" }}
                >
                  {step}
                </span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Example query showcase ── */}
      <section className="max-w-6xl mx-auto px-8 py-16">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            What you can ask
          </p>
          <h2
            className="text-3xl font-light text-foreground"
            style={{ fontFamily: "var(--font-crimson)" }}
          >
            Questions no Ctrl+F can answer
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              q: "How do the training methodologies differ between BERT and GPT-3?",
              tag: "Methodology comparison",
            },
            {
              q: "Which papers report the highest accuracy on ImageNet, and what techniques do they attribute this to?",
              tag: "Findings synthesis",
            },
            {
              q: "Are there any contradictions in how these papers define 'attention'?",
              tag: "Contradiction detection",
            },
            {
              q: "Summarize the limitations acknowledged across all uploaded papers.",
              tag: "Cross-paper summary",
            },
          ].map(({ q, tag }) => (
            <div
              key={tag}
              className="rounded-xl border border-border bg-card p-5 hover:border-primary/20 transition-colors"
            >
              <Badge variant="secondary" className="text-[10px] mb-3">
                {tag}
              </Badge>
              <p className="text-sm text-foreground leading-relaxed">
                &ldquo;{q}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mock UI preview ── */}
      <section className="max-w-6xl mx-auto px-8 py-16">
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xl shadow-primary/5">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
            <div className="w-3 h-3 rounded-full bg-red-400/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
            <div className="w-3 h-3 rounded-full bg-green-400/60" />
            <div className="flex-1 mx-4">
              <div className="h-5 rounded-md bg-background/80 border border-border max-w-xs mx-auto flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground">
                  scholarai.app/project/transformer-survey
                </span>
              </div>
            </div>
          </div>

          {/* Mock workspace */}
          <div className="flex h-80">
            {/* Left — paper list */}
            <div className="w-64 border-r border-border bg-muted/10 flex flex-col shrink-0">
              <div className="px-3 py-2.5 border-b border-border">
                <p className="text-[10px] font-semibold text-foreground">
                  Paper Library
                </p>
                <p className="text-[9px] text-muted-foreground">4/4 ready</p>
              </div>
              <div className="p-2 space-y-1">
                {[
                  {
                    title: "Attention Is All You Need",
                    authors: "Vaswani et al.",
                  },
                  {
                    title: "BERT: Pre-training of Deep...",
                    authors: "Devlin et al.",
                  },
                  {
                    title: "GPT-3: Language Models are...",
                    authors: "Brown et al.",
                  },
                  { title: "RoBERTa: A Robustly...", authors: "Liu et al." },
                ].map((p) => (
                  <div
                    key={p.title}
                    className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60 cursor-pointer"
                  >
                    <BookOpen className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium text-foreground truncate">
                        {p.title}
                      </p>
                      <p className="text-[9px] text-muted-foreground">
                        {p.authors}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — chat */}
            <div className="flex-1 flex flex-col">
              <div className="flex-1 p-4 space-y-3 overflow-hidden">
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-xl px-3 py-2 text-xs max-w-[80%]">
                    How do BERT and GPT-3 differ in their training approach?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-muted text-foreground rounded-xl px-3 py-2 text-xs max-w-[85%] leading-relaxed">
                    BERT uses a masked language model objective trained
                    bidirectionally{" "}
                    <span className="text-primary font-medium">[1, p.3]</span>,
                    while GPT-3 employs autoregressive next-token prediction in
                    a unidirectional left-to-right manner{" "}
                    <span className="text-primary font-medium">[2, p.6]</span>.
                    BERT was pretrained on 16GB of text, whereas GPT-3 used
                    570GB across diverse web sources{" "}
                    <span className="text-primary font-medium">[2, p.8]</span>.
                  </div>
                </div>
              </div>
              <div className="p-3 border-t border-border">
                <div className="h-8 rounded-lg bg-muted border border-border flex items-center px-3">
                  <span className="text-xs text-muted-foreground">
                    Compare methodologies, find contradictions…
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="max-w-6xl mx-auto px-8 py-16">
        <div className="rounded-2xl bg-primary px-10 py-12 text-center relative overflow-hidden">
          {/* Background texture */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 50%, white 0%, transparent 50%)",
            }}
          />
          <h2
            className="text-3xl md:text-4xl font-light text-primary-foreground mb-4 relative"
            style={{ fontFamily: "var(--font-crimson)" }}
          >
            Ready to review smarter?
          </h2>
          <p className="text-primary-foreground/70 mb-8 relative max-w-md mx-auto">
            Stop skimming PDFs manually. Let ScholarAI do the synthesis while
            you focus on the insight.
          </p>
          <Link href="/sign-up">
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 h-12 px-8 text-base gap-2 relative"
            >
              Get started for free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
            <Microscope className="w-3 h-3 text-primary-foreground" />
          </div>
          <span
            className="font-semibold text-foreground"
            style={{ fontFamily: "var(--font-crimson)" }}
          >
            ScholarAI
          </span>
        </div>
        <p>Built with Next.js · Ollama · FAISS · MongoDB · Clerk</p>
      </footer>
    </main>
  );
}
