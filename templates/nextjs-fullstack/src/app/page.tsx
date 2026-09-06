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

// Deliberately the same page as templates/vite-react/src/App.tsx. Two
// templates, one look, is V1.1's acceptance test — and it has to be true of
// the starters before it can be true of anything generated from them.
export default function Home() {
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
