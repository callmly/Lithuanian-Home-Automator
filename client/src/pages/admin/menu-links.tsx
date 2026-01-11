import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff, Link, ExternalLink, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { MenuLink, ContentBlock } from "@shared/schema";

const linkSchema = z.object({
  labelLt: z.string().min(1, "Pavadinimas privalomas"),
  targetType: z.enum(["section", "url"]),
  targetValue: z.string().min(1, "Reikšmė privaloma"),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().default(0),
});

type LinkFormData = z.infer<typeof linkSchema>;

const BUILT_IN_SECTIONS = [
  { value: "plans", label: "Planai" },
  { value: "features", label: "Funkcijos" },
];

export default function AdminMenuLinks() {
  const { toast } = useToast();
  const [editingLink, setEditingLink] = useState<MenuLink | null>(null);
  const [deletingLink, setDeletingLink] = useState<MenuLink | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: links = [], isLoading } = useQuery<MenuLink[]>({
    queryKey: ["/api/admin/menu-links"],
  });

  const { data: contentBlocks = [] } = useQuery<ContentBlock[]>({
    queryKey: ["/api/admin/content-blocks"],
  });

  const sortedLinks = [...links].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const form = useForm<LinkFormData>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      labelLt: "",
      targetType: "section",
      targetValue: "",
      isActive: true,
      sortOrder: 0,
    },
  });

  const watchTargetType = form.watch("targetType");

  const createMutation = useMutation({
    mutationFn: async (data: LinkFormData) => {
      const res = await apiRequest("POST", "/api/admin/menu-links", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/menu-links"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu-links"] });
      toast({ title: "Nuoroda sukurta" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (err: Error) => {
      toast({ title: "Klaida", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<LinkFormData> }) => {
      const res = await apiRequest("PATCH", `/api/admin/menu-links/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/menu-links"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu-links"] });
      toast({ title: "Nuoroda atnaujinta" });
      setIsDialogOpen(false);
      setEditingLink(null);
      form.reset();
    },
    onError: (err: Error) => {
      toast({ title: "Klaida", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/menu-links/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/menu-links"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu-links"] });
      toast({ title: "Nuoroda ištrinta" });
      setDeletingLink(null);
    },
    onError: (err: Error) => {
      toast({ title: "Klaida", description: err.message, variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/menu-links/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/menu-links"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu-links"] });
    },
    onError: (err: Error) => {
      toast({ title: "Klaida", description: err.message, variant: "destructive" });
    },
  });

  const openCreateDialog = () => {
    setEditingLink(null);
    form.reset({
      labelLt: "",
      targetType: "section",
      targetValue: "",
      isActive: true,
      sortOrder: links.length,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (link: MenuLink) => {
    setEditingLink(link);
    form.reset({
      labelLt: link.labelLt,
      targetType: link.targetType as "section" | "url",
      targetValue: link.targetValue,
      isActive: link.isActive ?? true,
      sortOrder: link.sortOrder ?? 0,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: LinkFormData) => {
    if (editingLink) {
      updateMutation.mutate({ id: editingLink.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const availableSections = [
    ...BUILT_IN_SECTIONS,
    ...contentBlocks
      .filter((b) => b.slug)
      .map((b) => ({ value: b.slug!, label: b.titleLt || b.slug! })),
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Meniu nuorodos</h1>
          <p className="text-muted-foreground">
            Valdykite navigacijos meniu nuorodas antraštėje
          </p>
        </div>
        <Button onClick={openCreateDialog} data-testid="button-create-link">
          <Plus className="w-4 h-4 mr-2" />
          Pridėti nuorodą
        </Button>
      </div>

      {sortedLinks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nėra sukurtų meniu nuorodų</p>
            <Button className="mt-4" onClick={openCreateDialog} data-testid="button-create-first-link">
              <Plus className="w-4 h-4 mr-2" />
              Sukurti pirmą nuorodą
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedLinks.map((link) => (
            <Card key={link.id} className={!link.isActive ? "opacity-60" : ""} data-testid={`card-link-${link.id}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 py-4">
                <div className="flex items-center gap-3">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {link.labelLt}
                      {link.targetType === "section" ? (
                        <Badge variant="secondary" className="text-xs">
                          <Hash className="w-3 h-3 mr-1" />
                          {link.targetValue}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          URL
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Rūšiavimo eilė: {link.sortOrder ?? 0}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => toggleActiveMutation.mutate({ id: link.id, isActive: !link.isActive })}
                    title={link.isActive ? "Paslėpti" : "Rodyti"}
                    data-testid={`button-toggle-${link.id}`}
                  >
                    {link.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => openEditDialog(link)}
                    data-testid={`button-edit-${link.id}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setDeletingLink(link)}
                    data-testid={`button-delete-${link.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingLink ? "Redaguoti nuorodą" : "Nauja meniu nuoroda"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="labelLt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meniu tekstas</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="pvz. Apie mus" data-testid="input-link-label" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nuorodos tipas</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-link-type">
                          <SelectValue placeholder="Pasirinkite tipą" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="section">Puslapio sekcija</SelectItem>
                        <SelectItem value="url">Išorinė nuoroda</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchTargetType === "section" ? (
                <FormField
                  control={form.control}
                  name="targetValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sekcija</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-link-target">
                            <SelectValue placeholder="Pasirinkite sekciją" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableSections.map((section) => (
                            <SelectItem key={section.value} value={section.value}>
                              {section.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">
                        Puslapio sekcija, į kurią nukreipiama
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="targetValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL adresas</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://..." data-testid="input-link-url" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Pilnas URL adresas (atsidaro naujame lange)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rūšiavimo eilė</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-link-sort" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Aktyvus</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-link-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Atšaukti
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingLink ? "Išsaugoti" : "Sukurti"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingLink} onOpenChange={() => setDeletingLink(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ištrinti nuorodą?</AlertDialogTitle>
            <AlertDialogDescription>
              Ar tikrai norite ištrinti nuorodą "{deletingLink?.labelLt}"? Šio veiksmo negalima atšaukti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Atšaukti</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingLink && deleteMutation.mutate(deletingLink.id)}
              className="bg-destructive text-destructive-foreground hover-elevate"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Ištrinti
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
