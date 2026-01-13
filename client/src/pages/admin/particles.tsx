import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ParticlesSettings } from "@shared/schema";

const particlesFormSchema = z.object({
  enabled: z.boolean().default(false),
  color: z.string().default("#6366f1"),
  quantity: z.number().min(10).max(200).default(50),
  speed: z.number().min(10).max(100).default(50),
  opacity: z.number().min(10).max(100).default(30),
});

type ParticlesFormData = z.infer<typeof particlesFormSchema>;

export default function AdminParticles() {
  const { toast } = useToast();
  const [previewEnabled, setPreviewEnabled] = useState(false);

  const { data: settings, isLoading } = useQuery<ParticlesSettings>({
    queryKey: ["/api/particles-settings"],
  });

  const form = useForm<ParticlesFormData>({
    resolver: zodResolver(particlesFormSchema),
    defaultValues: {
      enabled: false,
      color: "#6366f1",
      quantity: 50,
      speed: 50,
      opacity: 30,
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        enabled: settings.enabled ?? false,
        color: settings.color ?? "#6366f1",
        quantity: settings.quantity ?? 50,
        speed: settings.speed ?? 50,
        opacity: settings.opacity ?? 30,
      });
    }
  }, [settings, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: ParticlesFormData) => {
      return apiRequest("PUT", "/api/admin/particles-settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/particles-settings"] });
      toast({
        title: "Išsaugota",
        description: "Dalelių nustatymai sėkmingai atnaujinti.",
      });
    },
    onError: () => {
      toast({
        title: "Klaida",
        description: "Nepavyko išsaugoti nustatymų.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  const watchedColor = form.watch("color");
  const watchedQuantity = form.watch("quantity");
  const watchedSpeed = form.watch("speed");
  const watchedOpacity = form.watch("opacity");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dalelių animacija</h1>
        <p className="text-muted-foreground">
          Konfigūruokite interaktyvią dalelių animaciją Hero sekcijoje
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Nustatymai
            </CardTitle>
            <CardDescription>
              Koreguokite dalelių išvaizdą ir elgesį
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel className="text-base">Įjungti dalelių animaciją</FormLabel>
                        <FormDescription>
                          Rodyti animuotas daleles Hero sekcijos fone
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-particles-enabled"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dalelių spalva</FormLabel>
                      <FormControl>
                        <div className="flex gap-3">
                          <Input
                            type="color"
                            className="h-10 w-20 cursor-pointer p-1"
                            {...field}
                            data-testid="input-particles-color"
                          />
                          <Input
                            type="text"
                            placeholder="#6366f1"
                            {...field}
                            className="flex-1"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Pasirinkite spalvą, kuri derės su jūsų dizainu
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Dalelių kiekis</FormLabel>
                        <span className="text-sm text-muted-foreground">{field.value}</span>
                      </div>
                      <FormControl>
                        <Slider
                          min={10}
                          max={200}
                          step={5}
                          value={[field.value]}
                          onValueChange={(v) => field.onChange(v[0])}
                          data-testid="slider-particles-quantity"
                        />
                      </FormControl>
                      <FormDescription>
                        Mažiau dalelių = geresnis našumas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="speed"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Judėjimo greitis</FormLabel>
                        <span className="text-sm text-muted-foreground">{field.value}%</span>
                      </div>
                      <FormControl>
                        <Slider
                          min={10}
                          max={100}
                          step={5}
                          value={[field.value]}
                          onValueChange={(v) => field.onChange(v[0])}
                          data-testid="slider-particles-speed"
                        />
                      </FormControl>
                      <FormDescription>
                        Lėtesnis judėjimas atrodo subtiliau
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="opacity"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Permatomumas</FormLabel>
                        <span className="text-sm text-muted-foreground">{field.value}%</span>
                      </div>
                      <FormControl>
                        <Slider
                          min={10}
                          max={100}
                          step={5}
                          value={[field.value]}
                          onValueChange={(v) => field.onChange(v[0])}
                          data-testid="slider-particles-opacity"
                        />
                      </FormControl>
                      <FormDescription>
                        Mažesnis permatomumas = subtilesnė animacija
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  data-testid="button-save-particles"
                >
                  {saveMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Išsaugoti nustatymus
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Peržiūra</CardTitle>
            <CardDescription>
              Pažiūrėkite, kaip atrodys dalelių animacija
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="relative h-64 overflow-hidden rounded-lg bg-gradient-to-br from-primary/5 via-background to-accent/20"
              style={{ position: "relative" }}
            >
              {previewEnabled && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${watchedColor}15, transparent 50%), radial-gradient(circle at 70% 70%, ${watchedColor}10, transparent 50%)`,
                  }}
                >
                  <div className="text-center">
                    <div
                      className="mx-auto mb-2 h-3 w-3 rounded-full animate-pulse"
                      style={{ backgroundColor: watchedColor, opacity: watchedOpacity / 100 }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Dalelės: {watchedQuantity} | Greitis: {watchedSpeed}%
                    </p>
                  </div>
                </div>
              )}
              {!previewEnabled && (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    Įjunkite peržiūrą, kad pamatytumėte animaciją
                  </p>
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm">Rodyti peržiūrą</span>
              <Switch
                checked={previewEnabled}
                onCheckedChange={setPreviewEnabled}
                data-testid="switch-particles-preview"
              />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Pastaba: Tikra dalelių animacija bus matoma tik pagrindiniame puslapyje.
              Ši peržiūra rodo tik pasirinktas spalvas.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
