import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#050014] text-white relative">
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-[#050014]/85 to-[#050014]/95" />
      <Card className="w-full max-w-md mx-4 bg-white/5 border-white/10 backdrop-blur-2xl text-white relative z-10">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-amber-300" />
            <h1 className="text-2xl font-bold">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-white/70">
            Did you forget to add the page to the router?
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
