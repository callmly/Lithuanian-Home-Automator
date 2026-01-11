import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff, Code, AlignLeft, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import type { ContentBlock } from "@shared/schema";

const blockSchema = z.object({
  titleLt: z.string().min(1, "Pavadinimas privalomas"),
  slug: z.string().regex(/^[a-z0-9-]*$/, "Tik mažosios raidės, skaičiai ir brūkšneliai").optional().nullable(),
  contentLt: z.string().min(1, "Turinys privalomas"),
  isHtml: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().default(0),
});

type BlockFormData = z.infer<typeof blockSchema>;

export default function AdminContentBlocks() {
  const { toast } = useToast();
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);
  const [deletingBlock, setDeletingBlock] = useState<ContentBlock | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: blocks = [], isLoading } = useQuery<ContentBlock[]>({
    queryKey: ["/api/admin/content-blocks"],
  });

  const sortedBlocks = [...blocks].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const form = useForm<BlockFormData>({
    resolver: zodResolver(blockSchema),
    defaultValues: {
      titleLt: "",
      slug: "",
      contentLt: "",
      isHtml: false,
      isActive: true,
      sortOrder: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: BlockFormData) => {
      const res = await apiRequest("POST", "/api/admin/content-blocks", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content-blocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/content-blocks"] });
      toast({ title: "Blokas sukurtas" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (err: Error) => {
      toast({ title: "Klaida", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<BlockFormData> }) => {
      const res = await apiRequest("PATCH", `/api/admin/content-blocks/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content-blocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/content-blocks"] });
      toast({ title: "Blokas atnaujintas" });
      setIsDialogOpen(false);
      setEditingBlock(null);
      form.reset();
    },
    onError: (err: Error) => {
      toast({ title: "Klaida", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/content-blocks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content-blocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/content-blocks"] });
      toast({ title: "Blokas ištrintas" });
      setDeletingBlock(null);
    },
    onError: (err: Error) => {
      toast({ title: "Klaida", description: err.message, variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/content-blocks/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content-blocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/content-blocks"] });
    },
    onError: (err: Error) => {
      toast({ title: "Klaida", description: err.message, variant: "destructive" });
    },
  });

  const openCreateDialog = () => {
    setEditingBlock(null);
    form.reset({
      titleLt: "",
      slug: "",
      contentLt: "",
      isHtml: false,
      isActive: true,
      sortOrder: blocks.length,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (block: ContentBlock) => {
    setEditingBlock(block);
    form.reset({
      titleLt: block.titleLt ?? "",
      slug: block.slug ?? "",
      contentLt: block.contentLt ?? "",
      isHtml: block.isHtml ?? false,
      isActive: block.isActive ?? true,
      sortOrder: block.sortOrder ?? 0,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: BlockFormData) => {
    if (editingBlock) {
      updateMutation.mutate({ id: editingBlock.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const canCreateMore = blocks.length < 10;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Turinio blokai</h1>
          <p className="text-muted-foreground">
            Papildomi informaciniai blokai rodomi prieš puslapio apačią ({blocks.length}/10)
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          disabled={!canCreateMore}
          data-testid="button-create-block"
        >
          <Plus className="w-4 h-4 mr-2" />
          Pridėti bloką
        </Button>
      </div>

      {sortedBlocks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nėra sukurtų turinio blokų</p>
            <Button className="mt-4" onClick={openCreateDialog} data-testid="button-create-first-block">
              <Plus className="w-4 h-4 mr-2" />
              Sukurti pirmą bloką
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedBlocks.map((block) => (
            <Card key={block.id} className={!block.isActive ? "opacity-60" : ""} data-testid={`card-block-${block.id}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {block.titleLt}
                      {block.isHtml ? (
                        <Badge variant="secondary" className="text-xs">
                          <Code className="w-3 h-3 mr-1" />
                          HTML
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <AlignLeft className="w-3 h-3 mr-1" />
                          Tekstas
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {block.slug && <span className="mr-2">#{block.slug}</span>}
                      Rūšiavimo eilė: {block.sortOrder ?? 0}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => toggleActiveMutation.mutate({ id: block.id, isActive: !block.isActive })}
                    title={block.isActive ? "Paslėpti" : "Rodyti"}
                    data-testid={`button-toggle-${block.id}`}
                  >
                    {block.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => openEditDialog(block)}
                    data-testid={`button-edit-${block.id}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setDeletingBlock(block)}
                    data-testid={`button-delete-${block.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md max-h-32 overflow-auto">
                  {block.isHtml ? (
                    <code className="text-xs whitespace-pre-wrap">{(block.contentLt ?? "").substring(0, 500)}{(block.contentLt ?? "").length > 500 ? "..." : ""}</code>
                  ) : (
                    <p className="whitespace-pre-wrap">{(block.contentLt ?? "").substring(0, 300)}{(block.contentLt ?? "").length > 300 ? "..." : ""}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBlock ? "Redaguoti bloką" : "Naujas turinio blokas"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="titleLt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pavadinimas</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Bloko pavadinimas" data-testid="input-block-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nuorodos ID (slug)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value ?? ""} 
                        placeholder="pvz: apie-mus" 
                        data-testid="input-block-slug" 
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Naudojama meniu nuorodose, pvz. #apie-mus
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rūšiavimo eilė</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-block-sort" />
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
                        <FormDescription className="text-xs">
                          Rodyti viešai
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-block-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isHtml"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>HTML režimas</FormLabel>
                      <FormDescription className="text-xs">
                        Įjungus, turinys bus rodomas kaip HTML kodas
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-block-html"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contentLt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turinys</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={10}
                        placeholder={form.watch("isHtml") ? "<div>Jūsų HTML turinys...</div>" : "Jūsų tekstas..."}
                        className="font-mono text-sm"
                        data-testid="textarea-block-content"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                  {editingBlock ? "Išsaugoti" : "Sukurti"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingBlock} onOpenChange={() => setDeletingBlock(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ištrinti bloką?</AlertDialogTitle>
            <AlertDialogDescription>
              Ar tikrai norite ištrinti bloką "{deletingBlock?.titleLt}"? Šio veiksmo negalima atšaukti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Atšaukti</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingBlock && deleteMutation.mutate(deletingBlock.id)}
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
