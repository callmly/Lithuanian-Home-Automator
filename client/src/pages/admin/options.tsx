import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Loader2, ChevronDown, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { OptionGroup, Option } from "@shared/schema";
import { cn } from "@/lib/utils";

const groupSchema = z.object({
  typeLt: z.enum(["quantity", "switch", "addon"]),
  titleLt: z.string().min(1, "Pavadinimas privalomas"),
  descriptionLt: z.string().optional(),
  sortOrder: z.coerce.number().default(0),
});

const optionSchema = z.object({
  groupId: z.coerce.number(),
  labelLt: z.string().min(1, "Pavadinimas privalomas"),
  descriptionLt: z.string().optional(),
  unitPriceCents: z.coerce.number().min(0),
  minQty: z.coerce.number().min(1).default(1),
  maxQty: z.coerce.number().min(1).default(100),
  defaultQty: z.coerce.number().min(1).default(1),
  isDefault: z.boolean().default(false),
  sortOrder: z.coerce.number().default(0),
  tooltipEnabled: z.boolean().default(false),
  tooltipText: z.string().optional(),
  tooltipLink: z.string().optional(),
  tooltipImage: z.string().optional(),
});

type GroupFormData = z.infer<typeof groupSchema>;
type OptionFormData = z.infer<typeof optionSchema>;

const typeLabels: Record<string, string> = {
  quantity: "Kiekis",
  switch: "Pasirinkimas",
  addon: "Papildomos funkcijos",
};

export default function AdminOptions() {
  const { toast } = useToast();
  const [editingGroup, setEditingGroup] = useState<OptionGroup | null>(null);
  const [editingOption, setEditingOption] = useState<Option | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<OptionGroup | null>(null);
  const [deletingOption, setDeletingOption] = useState<Option | null>(null);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isOptionDialogOpen, setIsOptionDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [openGroups, setOpenGroups] = useState<Set<number>>(new Set());

  const { data: optionsData, isLoading } = useQuery<{
    groups: OptionGroup[];
    options: Option[];
  }>({
    queryKey: ["/api/options"],
  });

  const groups = optionsData?.groups || [];
  const options = optionsData?.options || [];

  const groupForm = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      typeLt: "quantity",
      titleLt: "",
      descriptionLt: "",
      sortOrder: 0,
    },
  });

  const optionForm = useForm<OptionFormData>({
    resolver: zodResolver(optionSchema),
    defaultValues: {
      groupId: 0,
      labelLt: "",
      descriptionLt: "",
      unitPriceCents: 0,
      minQty: 1,
      maxQty: 100,
      defaultQty: 1,
      isDefault: false,
      sortOrder: 0,
      tooltipEnabled: false,
      tooltipText: "",
      tooltipLink: "",
      tooltipImage: "",
    },
  });

  const saveGroupMutation = useMutation({
    mutationFn: async (data: GroupFormData) => {
      if (editingGroup) {
        return apiRequest("PATCH", `/api/admin/option-groups/${editingGroup.id}`, data);
      }
      return apiRequest("POST", "/api/admin/option-groups", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/options"] });
      toast({ title: editingGroup ? "Grupė atnaujinta" : "Grupė sukurta" });
      closeGroupDialog();
    },
    onError: () => {
      toast({ title: "Klaida", variant: "destructive" });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/option-groups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/options"] });
      toast({ title: "Grupė ištrinta" });
      setDeletingGroup(null);
    },
  });

  const saveOptionMutation = useMutation({
    mutationFn: async (data: OptionFormData) => {
      if (editingOption) {
        return apiRequest("PATCH", `/api/admin/options/${editingOption.id}`, data);
      }
      return apiRequest("POST", "/api/admin/options", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/options"] });
      toast({ title: editingOption ? "Opcija atnaujinta" : "Opcija sukurta" });
      closeOptionDialog();
    },
    onError: () => {
      toast({ title: "Klaida", variant: "destructive" });
    },
  });

  const deleteOptionMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/options/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/options"] });
      toast({ title: "Opcija ištrinta" });
      setDeletingOption(null);
    },
  });

  const openGroupDialog = (group?: OptionGroup) => {
    if (group) {
      setEditingGroup(group);
      groupForm.reset({
        typeLt: group.typeLt as "quantity" | "switch" | "addon",
        titleLt: group.titleLt,
        descriptionLt: group.descriptionLt || "",
        sortOrder: group.sortOrder || 0,
      });
    } else {
      setEditingGroup(null);
      groupForm.reset();
    }
    setIsGroupDialogOpen(true);
  };

  const closeGroupDialog = () => {
    setIsGroupDialogOpen(false);
    setEditingGroup(null);
    groupForm.reset();
  };

  const openOptionDialog = (groupId: number, option?: Option) => {
    setSelectedGroupId(groupId);
    if (option) {
      setEditingOption(option);
      optionForm.reset({
        groupId: option.groupId,
        labelLt: option.labelLt,
        descriptionLt: option.descriptionLt || "",
        unitPriceCents: option.unitPriceCents,
        minQty: option.minQty || 1,
        maxQty: option.maxQty || 100,
        defaultQty: option.defaultQty || 1,
        isDefault: option.isDefault || false,
        sortOrder: option.sortOrder || 0,
        tooltipEnabled: option.tooltipEnabled || false,
        tooltipText: option.tooltipText || "",
        tooltipLink: option.tooltipLink || "",
        tooltipImage: option.tooltipImage || "",
      });
    } else {
      setEditingOption(null);
      optionForm.reset({
        groupId,
        labelLt: "",
        descriptionLt: "",
        unitPriceCents: 0,
        minQty: 1,
        maxQty: 100,
        defaultQty: 1,
        isDefault: false,
        sortOrder: 0,
        tooltipEnabled: false,
        tooltipText: "",
        tooltipLink: "",
        tooltipImage: "",
      });
    }
    setIsOptionDialogOpen(true);
  };

  const closeOptionDialog = () => {
    setIsOptionDialogOpen(false);
    setEditingOption(null);
    setSelectedGroupId(null);
    optionForm.reset();
  };

  const toggleGroup = (groupId: number) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString("lt-LT");
  };

  const getGroupOptions = (groupId: number) => {
    return options
      .filter((o) => o.groupId === groupId)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Opcijos</h1>
          <p className="text-muted-foreground">
            Valdykite kiekius, pasirinkimus ir papildomas funkcijas
          </p>
        </div>
        <Button onClick={() => openGroupDialog()} data-testid="button-add-group">
          <Plus className="mr-2 h-4 w-4" />
          Pridėti grupę
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="mb-4 text-muted-foreground">Dar nėra sukurtų grupių</p>
            <Button onClick={() => openGroupDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Sukurti pirmą grupę
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {[...groups]
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
            .map((group) => {
              const groupOptions = getGroupOptions(group.id);
              const isOpen = openGroups.has(group.id);
              return (
                <Collapsible
                  key={group.id}
                  open={isOpen}
                  onOpenChange={() => toggleGroup(group.id)}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CollapsibleTrigger asChild>
                          <button className="flex flex-1 items-center gap-3 text-left">
                            <ChevronDown
                              className={cn(
                                "h-5 w-5 text-muted-foreground transition-transform",
                                isOpen && "rotate-180"
                              )}
                            />
                            <div>
                              <CardTitle className="text-lg">
                                {group.titleLt}
                              </CardTitle>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="secondary">
                                  {typeLabels[group.typeLt] || group.typeLt}
                                </Badge>
                                <span>{groupOptions.length} opcijos</span>
                              </div>
                            </div>
                          </button>
                        </CollapsibleTrigger>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openGroupDialog(group)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingGroup(group)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CollapsibleContent>
                      <CardContent className="border-t pt-4">
                        <div className="mb-4 flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openOptionDialog(group.id)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Pridėti opciją
                          </Button>
                        </div>
                        {groupOptions.length === 0 ? (
                          <p className="text-center text-sm text-muted-foreground">
                            Nėra opcijų
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {groupOptions.map((option) => (
                              <div
                                key={option.id}
                                className="flex items-center justify-between rounded-lg border p-3"
                              >
                                <div>
                                  <div className="font-medium">
                                    {option.labelLt}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {formatPrice(option.unitPriceCents)} € / vnt.
                                    {option.isDefault && (
                                      <Badge className="ml-2" variant="secondary">
                                        Numatyta
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      openOptionDialog(group.id, option)
                                    }
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDeletingOption(option)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
        </div>
      )}

      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? "Redaguoti grupę" : "Nauja grupė"}
            </DialogTitle>
            <DialogDescription>
              Grupės skirtos organizuoti opcijas pagal tipą
            </DialogDescription>
          </DialogHeader>
          <Form {...groupForm}>
            <form
              onSubmit={groupForm.handleSubmit((data) =>
                saveGroupMutation.mutate(data)
              )}
              className="space-y-4"
            >
              <FormField
                control={groupForm.control}
                name="titleLt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pavadinimas *</FormLabel>
                    <FormControl>
                      <Input placeholder="Kiekis" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={groupForm.control}
                name="typeLt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipas *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="quantity">Kiekis</SelectItem>
                        <SelectItem value="switch">Pasirinkimas</SelectItem>
                        <SelectItem value="addon">Papildomos funkcijos</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={groupForm.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rikiavimo eilė</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={closeGroupDialog}>
                  Atšaukti
                </Button>
                <Button type="submit" disabled={saveGroupMutation.isPending}>
                  {saveGroupMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingGroup ? "Išsaugoti" : "Sukurti"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isOptionDialogOpen} onOpenChange={setIsOptionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingOption ? "Redaguoti opciją" : "Nauja opcija"}
            </DialogTitle>
          </DialogHeader>
          <Form {...optionForm}>
            <form
              onSubmit={optionForm.handleSubmit((data) =>
                saveOptionMutation.mutate(data)
              )}
              className="space-y-4"
            >
              <FormField
                control={optionForm.control}
                name="labelLt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pavadinimas *</FormLabel>
                    <FormControl>
                      <Input placeholder="Apšvietimo taškai" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={optionForm.control}
                name="unitPriceCents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kaina (centais)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="5000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={optionForm.control}
                  name="minQty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min kiekis</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={optionForm.control}
                  name="maxQty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max kiekis</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={optionForm.control}
                  name="defaultQty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numatytas</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={optionForm.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel className="cursor-pointer">
                      Pasirinkta pagal nutylėjimą
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
              <div className="rounded-lg border p-4 space-y-4">
                <FormField
                  control={optionForm.control}
                  name="tooltipEnabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <FormLabel className="cursor-pointer mb-0">
                          Rodyti patarimą (tooltip)
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {optionForm.watch("tooltipEnabled") && (
                  <>
                    <FormField
                      control={optionForm.control}
                      name="tooltipText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patarimo tekstas</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Įveskite paaiškinamąjį tekstą..."
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={optionForm.control}
                      name="tooltipLink"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nuoroda (neprivaloma)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://example.com/daugiau-info"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={optionForm.control}
                      name="tooltipImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Paveikslėlio URL (neprivaloma)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://example.com/image.jpg"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={closeOptionDialog}>
                  Atšaukti
                </Button>
                <Button type="submit" disabled={saveOptionMutation.isPending}>
                  {saveOptionMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingOption ? "Išsaugoti" : "Sukurti"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingGroup}
        onOpenChange={(open) => !open && setDeletingGroup(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ištrinti grupę?</AlertDialogTitle>
            <AlertDialogDescription>
              Bus ištrintos visos grupės opcijos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Atšaukti</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingGroup && deleteGroupMutation.mutate(deletingGroup.id)}
              className="bg-destructive text-destructive-foreground"
            >
              Ištrinti
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deletingOption}
        onOpenChange={(open) => !open && setDeletingOption(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ištrinti opciją?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Atšaukti</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingOption && deleteOptionMutation.mutate(deletingOption.id)}
              className="bg-destructive text-destructive-foreground"
            >
              Ištrinti
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
