import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, User, Home } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/login", { username, password });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/admin");
    },
    onError: () => {
      setError("Neteisingas vartotojo vardas arba slaptažodis");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Home className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">KNX Admin</CardTitle>
          <CardDescription>
            Prisijunkite prie administravimo panelės
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">Vartotojo vardas</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  placeholder="admin"
                  required
                  data-testid="input-username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Slaptažodis</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  placeholder="••••••••"
                  required
                  data-testid="input-password"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loginMutation.isPending}
              data-testid="button-login"
            >
              {loginMutation.isPending ? "Jungiamasi..." : "Prisijungti"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
