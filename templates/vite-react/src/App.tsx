import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// This page is a starter, and a starter is the strongest prompt in the
// repo — whatever it demonstrates is what gets imitated. So it composes
// from src/components/ui/ and uses semantic colours, rather than showing
// off a hand-rolled button and a literal `bg-zinc-50`.
function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-6 text-foreground">
      <Badge variant="secondary">
        <Sparkles /> Ready to build
      </Badge>

      <Card className="w-full max-w-lg animate-fade-in">
        <CardHeader>
          <CardTitle className="text-3xl">Start here</CardTitle>
          <CardDescription>
            Describe what you want and this page gets replaced.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button>Primary action</Button>
          <Button variant="outline">Secondary</Button>
        </CardContent>
      </Card>
    </main>
  );
}

export default App;
