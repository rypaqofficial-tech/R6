import { useLocation } from "wouter";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import BrandLockup from "../components/BrandLockup";
import { ArrowRight, Zap, Target, Brain, Crown } from "lucide-react";

/**
 * Home - Premium landing page with "Consolidation" strategy
 * Design: Cyan Frost, Steel Gray, Midnight Navy, Ice White palette
 * Message: Victory is a Calculation, Not a Risk
 * Rockefeller Quote: "The ability to deal with people is as purchasable a commodity as sugar or coffee..."
 */
export default function Home() {
  const [, setLocation] = useLocation();

  const advantages = [
    {
      icon: Brain,
      title: "Informational Superiority",
      description: "Multi-node predictive AI synthesized with classical power dynamics",
    },
    {
      icon: Target,
      title: "Structural Foresight",
      description: "Identify value before it enters public consciousness",
    },
    {
      icon: Zap,
      title: "Calculated Outcomes",
      description: "Mathematical certainty replaces speculation",
    },
    {
      icon: Crown,
      title: "Financial Hegemony",
      description: "Establish dominance in every negotiation and exit",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-md bg-background/85 supports-[backdrop-filter]:bg-background/70">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setLocation("/")}
            className="flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <BrandLockup />
          </button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setLocation("/login")} className="text-foreground">
              Sign in
            </Button>
            <Button
              onClick={() => setLocation("/login")}
              className="gap-2 bg-primary hover:bg-primary/90 text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Access platform
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      <section className="relative min-h-[78vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-[center_30%] sm:bg-center bg-no-repeat bg-scroll lg:bg-fixed"
          style={{
            backgroundImage: "url('/brand/hero-background.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/82 to-background/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 py-28 sm:py-36 lg:py-44">
          <div className="max-w-3xl">
            <h2 className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground mb-6">
              Victory is a Calculation,
              <span className="text-primary"> Not a Risk</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              The most successful monopolies were built on knowing the end before the beginning. We provide the structural foresight to acquire, optimize, and dominate. Leave the "calculated risks" to your competitors; we prefer calculated outcomes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => setLocation("/login")}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Secure your dominance
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-primary text-primary hover:bg-primary/10 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => document.getElementById("advantages")?.scrollIntoView({ behavior: "smooth" })}
              >
                Learn more
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Rockefeller Quote Section */}
      <section className="py-16 bg-slate-900 border-y border-border">
        <div className="max-w-4xl mx-auto px-6">
          <blockquote className="text-center">
            <p className="text-2xl sm:text-3xl font-light text-white mb-6 italic leading-relaxed">
              "The ability to deal with people is as purchasable a commodity as sugar or coffee and I will pay more for that ability than for any other under the sun."
            </p>
            <footer className="text-primary font-semibold">— J.D. Rockefeller</footer>
          </blockquote>
        </div>
      </section>

      <section id="advantages" className="py-20 bg-background scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-foreground mb-4">The Sovereign Advantage</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              In the court of global capital, sentiment is a liability and consensus is a trap. We are architects of informational superiority.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {advantages.map((adv, idx) => {
              const Icon = adv.icon;
              return (
                <Card key={idx} className="bg-card border-border hover:border-primary/50 transition-colors">
                  <CardContent className="pt-8">
                    <Icon className="h-8 w-8 text-primary mb-4" />
                    <h4 className="text-lg font-semibold text-foreground mb-2">{adv.title}</h4>
                    <p className="text-sm text-muted-foreground">{adv.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Mission */}
            <div>
              <h3 className="text-3xl font-bold text-white mb-6">The Synthesis of Power</h3>
              <p className="text-lg text-slate-300 leading-relaxed mb-6">
                To eliminate the element of chance from the private equity lifecycle. We deploy advanced predictive intelligence to strip away the "fog of war" in mid-market and enterprise acquisitions, ensuring our partners hold the high ground in every negotiation, every consolidation, and every exit.
              </p>
              <p className="text-sm text-slate-400">Our Mission</p>
            </div>

            {/* Vision */}
            <div>
              <h3 className="text-3xl font-bold text-white mb-6">The Finality of Foresight</h3>
              <p className="text-lg text-slate-300 leading-relaxed mb-6">
                To establish a new standard of financial hegemony where "risk" is an obsolete term. We envision a future where the gap between prediction and reality is closed, and where the most significant moves in the market are decided in our engines before they are ever whispered in a boardroom.
              </p>
              <p className="text-sm text-slate-400">Our Vision</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background border-t border-border">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-4xl font-bold text-foreground mb-6">Ready to Own the Future?</h3>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join the elite firms that have already secured their dominance through predictive foresight.
          </p>
          <Button
            onClick={() => setLocation("/login")}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Get started
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="mb-4 [&_img]:max-w-[160px] [&_img]:max-h-10">
                <BrandLockup
                  wordmarkClassName="text-lg font-bold tracking-tight text-white"
                  markClassName="h-8 w-auto max-h-10 max-w-[160px] object-left object-contain"
                />
              </div>
              <p className="text-sm text-slate-400">Operating system for African GPs — pipeline to portfolio in one place.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <button type="button" onClick={() => setLocation("/login")} className="hover:text-primary text-left">
                    Smart deal sourcing
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => setLocation("/login")} className="hover:text-primary text-left">
                    Due diligence
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => setLocation("/register")} className="hover:text-primary text-left">
                    Create account
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <button type="button" onClick={() => setLocation("/login")} className="hover:text-primary text-left">
                    LP portal
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => document.getElementById("advantages")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-primary text-left">
                    Platform overview
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="text-slate-500">Privacy & terms — contact your administrator.</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 space-y-2">
            <p className="text-center text-sm text-slate-400">
              © 2026 RYPAQ. In the court of capital, those who see the furthest move the fastest.
            </p>
            <p className="text-center text-xs text-slate-600">
              Hero photo via{" "}
              <a
                href="https://www.pexels.com"
                className="underline underline-offset-2 hover:text-slate-400"
                target="_blank"
                rel="noreferrer"
              >
                Pexels
              </a>
              . Swap the file at <code className="text-slate-500">public/brand/hero-background.jpg</code>.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
