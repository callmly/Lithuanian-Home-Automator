import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Loader2, Star, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Plan, OptionGroup, PlanOptionGroup } from "@shared/schema";
import { cn } from "@/lib/utils";

const planSchema = z.object({
  slug: z.string().min(1, "Slug privalomas"),
  nameLt: z.string().min(1, "Pavadinimas privalomas"),
  taglineLt: z.string().optional(),
  descriptionLt: z.string().optional(),
  basePriceCents: z.coerce.number().min(0, "Kaina negali būti neigiama"),
  isHighlighted: z.boolean().default(false),
  sortOrder: z.coerce.number().default(0),
});

type PlanFormData = z.infer<typeof planSchema>;

export default function AdminPlans() {
  const { toast } = useToast();
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [configuringPlan, setConfiguringPlan] = useState<Plan | null>(null);
  const [selectedOptionGroupIds, setSelectedOptionGroupIds] = useState<number[]>([]);

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ["/api/plans"],
  });

  const { data: optionsData } = useQuery<{
    groups: OptionGroup[];
    options: unknown[];
    planOptionGroups: PlanOptionGroup[];
  }>({
    queryKey: ["/api/options"],
  });

  const optionGroups = optionsData?.groups || [];
  const allPlanOptionGroups = optionsData?.planOptionGroups || [];

  const getOptionGroupsForPlan = (planId: number) => {
    return allPlanOptionGroups
      .filter((pog) => pog.planId === planId)
      .map((pog) => optionGroups.find((g) => g.id === pog.optionGroupId))
      .filter(Boolean) as OptionGroup[];
  };

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      slug: "",
      nameLt: "",
      taglineLt: "",
      descriptionLt: "",
      basePriceCents: 0,
      isHighlighted: false,
      sortOrder: 0,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: PlanFormData) => {
      if (editingPlan) {
        return apiRequest("PATCH", `/api/admin/plans/${editingPlan.id}`, data);
      }
      return apiRequest("POST", "/api/admin/plans", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      toast({
        title: editingPlan ? "Planas atnaujintas" : "Planas sukurtas",
      });
      closeDialog();
    },
    onError: () => {
      toast({
        title: "Klaida",
        description: "Nepavyko išsaugoti plano",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      toast({ title: "Planas ištrintas" });
      setDeletingPlan(null);
    },
    onError: () => {
      toast({
        title: "Klaida",
        description: "Nepavyko ištrinti plano",
        variant: "destructive",
      });
    },
  });

  const saveOptionGroupsMutation = useMutation({
    mutationFn: async ({ planId, optionGroupIds }: { planId: number; optionGroupIds: number[] }) => {
      return apiRequest("PUT", `/api/admin/plan-option-groups/${planId}`, { optionGroupIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/options"] });
      toast({ title: "Opcijų grupės išsaugotos" });
      setConfiguringPlan(null);
    },
    onError: () => {
      toast({
        title: "Klaida",
        description: "Nepavyko išsaugoti opcijų grupių",
        variant: "destructive",
      });
    },
  });

  const openConfigureDialog = (plan: Plan) => {
    setConfiguringPlan(plan);
    const currentGroupIds = allPlanOptionGroups
      .filter((pog) => pog.planId === plan.id)
      .map((pog) => pog.optionGroupId);
    setSelectedOptionGroupIds(currentGroupIds);
  };

  const handleOptionGroupToggle = (groupId: number, checked: boolean) => {
    if (checked) {
      setSelectedOptionGroupIds((prev) => [...prev, groupId]);
    } else {
      setSelectedOptionGroupIds((prev) => prev.filter((id) => id !== groupId));
    }
  };

  const handleSaveOptionGroups = () => {
    if (configuringPlan) {
      saveOptionGroupsMutation.mutate({
        planId: configuringPlan.id,
        optionGroupIds: selectedOptionGroupIds,
      });
    }
  };

  const openDialog = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      form.reset({
        slug: plan.slug,
        nameLt: plan.nameLt,
        taglineLt: plan.taglineLt || "",
        descriptionLt: plan.descriptionLt || "",
        basePriceCents: plan.basePriceCents,
        isHighlighted: plan.isHighlighted || false,
        sortOrder: plan.sortOrder || 0,
      });
    } else {
      setEditingPlan(null);
      form.reset({
        slug: "",
        nameLt: "",
        taglineLt: "",
        descriptionLt: "",
        basePriceCents: 0,
        isHighlighted: false,
        sortOrder: plans.length,
      });
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingPlan(null);
    form.reset();
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString("lt-LT");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Planai</h1>
          <p className="text-muted-foreground">
            Valdykite KNX automatizacijos paketus
          </p>
        </div>
        <Button onClick={() => openDialog()} data-testid="button-add-plan">
          <Plus className="mr-2 h-4 w-4" />
          Pridėti planą
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="mb-4 text-muted-foreground">Dar nėra sukurtų planų</p>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Sukurti pirmą planą
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {[...plans]
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
            .map((plan) => (
              <Card
                key={plan.id}
                className={cn(
                  "relative",
                  plan.isHighlighted && "border-primary ring-1 ring-primary"
                )}
                data-testid={`card-plan-${plan.id}`}
              >
                {plan.isHighlighted && (
                  <div className="absolute -top-2 right-4">
                    <Star className="h-5 w-5 fill-primary text-primary" />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span>{plan.nameLt}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openConfigureDialog(plan)}
                        title="Konfigūruoti opcijas"
                        data-testid={`button-configure-plan-${plan.id}`}
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDialog(plan)}
                        data-testid={`button-edit-plan-${plan.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingPlan(plan)}
                        data-testid={`button-delete-plan-${plan.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-2 text-sm text-muted-foreground">
                    {plan.taglineLt}
                  </div>
                  <div className="text-2xl font-bold">
                    {formatPrice(plan.basePriceCents)} €
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Slug: {plan.slug}
                  </div>
                  {getOptionGroupsForPlan(plan.id).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {getOptionGroupsForPlan(plan.id).map((group) => (
                        <Badge key={group.id} variant="secondary" className="text-xs">
                          {group.titleLt}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {getOptionGroupsForPlan(plan.id).length === 0 && (
                    <div className="mt-3 text-xs text-muted-foreground italic">
                      Visos opcijų grupės
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? "Redaguoti planą" : "Naujas planas"}
            </DialogTitle>
            <DialogDescription>
              Įveskite plano informaciją lietuvių kalba
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="nameLt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pavadinimas *</FormLabel>
                      <FormControl>
                        <Input placeholder="Bazinis" {...field} />
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
                      <FormLabel>Slug *</FormLabel>
                      <FormControl>
                        <Input placeholder="bazinis" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="taglineLt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trumpas aprašymas</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Pradinis KNX sprendimas"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descriptionLt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pilnas aprašymas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Kiekviena eilutė bus rodoma su varnele..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="basePriceCents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bazinė kaina (centais)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="299900"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rikiavimo eilė</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isHighlighted"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel className="cursor-pointer">
                      Paryškinti (populiariausias)
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Atšaukti
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingPlan ? "Išsaugoti" : "Sukurti"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingPlan}
        onOpenChange={(open) => !open && setDeletingPlan(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ištrinti planą?</AlertDialogTitle>
            <AlertDialogDescription>
              Ar tikrai norite ištrinti planą "{deletingPlan?.nameLt}"? Šis
              veiksmas negrįžtamas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Atšaukti</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPlan && deleteMutation.mutate(deletingPlan.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Ištrinti"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!configuringPlan}
        onOpenChange={(open) => !open && setConfiguringPlan(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Opcijų grupės - {configuringPlan?.nameLt}
            </DialogTitle>
            <DialogDescription>
              Pasirinkite, kurios opcijų grupės bus rodomos šiam planui. Jei nieko nepasirinksite, bus rodomos visos grupės.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {optionGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Dar nėra sukurtų opcijų grupių. Sukurkite jas "Opcijos" skyriuje.
              </p>
            ) : (
              optionGroups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center space-x-3 rounded-lg border p-3"
                >
                  <Checkbox
                    id={`group-${group.id}`}
                    checked={selectedOptionGroupIds.includes(group.id)}
                    onCheckedChange={(checked) =>
                      handleOptionGroupToggle(group.id, checked === true)
                    }
                    data-testid={`checkbox-option-group-${group.id}`}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={`group-${group.id}`}
                      className="cursor-pointer font-medium"
                    >
                      {group.titleLt}
                    </Label>
                    {group.descriptionLt && (
                      <p className="text-xs text-muted-foreground">
                        {group.descriptionLt}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {group.typeLt === "quantity"
                      ? "Kiekis"
                      : group.typeLt === "switch"
                      ? "Pasirinkimas"
                      : "Priedas"}
                  </Badge>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setConfiguringPlan(null)}
            >
              Atšaukti
            </Button>
            <Button
              onClick={handleSaveOptionGroups}
              disabled={saveOptionGroupsMutation.isPending}
              data-testid="button-save-option-groups"
            >
              {saveOptionGroupsMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Išsaugoti
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
