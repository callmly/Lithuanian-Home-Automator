import { useState, useMemo } from "react";
import { Check, ChevronDown, Minus, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedSection, AnimatedItem } from "@/components/ui/animated-section";
import { cn } from "@/lib/utils";
import { InfoTooltip } from "./info-tooltip";
import type { Plan, OptionGroup, Option } from "@shared/schema";
import type { PlanConfig } from "@/pages/landing";

interface PlansSectionProps {
  plans: Plan[];
  optionGroups: OptionGroup[];
  options: Option[];
  isLoading: boolean;
  onGetQuote: (plan: Plan, config: PlanConfig) => void;
}

export function PlansSection({
  plans,
  optionGroups,
  options,
  isLoading,
  onGetQuote,
}: PlansSectionProps) {
  const [expandedPlanId, setExpandedPlanId] = useState<number | null>(null);
  
  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    [plans]
  );

  const toggleExpanded = (planId: number) => {
    setExpandedPlanId((prev) => (prev === planId ? null : planId));
  };

  if (isLoading) {
    return (
      <section id="plans" className="py-20 lg:py-28">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-12 text-center">
            <Skeleton className="mx-auto mb-4 h-10 w-64" />
            <Skeleton className="mx-auto h-6 w-96" />
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-96 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="plans" className="py-20 lg:py-28">
      <div className="container mx-auto px-4 lg:px-8">
        <AnimatedSection className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight lg:text-4xl">
            Pasirinkite savo planą
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Trys paketai pritaikyti skirtingiems poreikiams. Kiekvienas paketas
            gali būti individualizuotas pagal jūsų namus.
          </p>
        </AnimatedSection>

        <div className="grid gap-8 md:grid-cols-3 items-stretch">
          {sortedPlans.map((plan, index) => (
            <AnimatedItem key={plan.id} delay={index * 80} className="h-full">
              <PlanCard
                plan={plan}
                optionGroups={optionGroups}
                options={options}
                onGetQuote={onGetQuote}
                isExpanded={expandedPlanId === plan.id}
                onToggleExpand={() => toggleExpanded(plan.id)}
              />
            </AnimatedItem>
          ))}
        </div>
      </div>
    </section>
  );
}

interface PlanCardProps {
  plan: Plan;
  optionGroups: OptionGroup[];
  options: Option[];
  onGetQuote: (plan: Plan, config: PlanConfig) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function PlanCard({ plan, optionGroups, options, onGetQuote, isExpanded, onToggleExpand }: PlanCardProps) {
  const [selectedOptions, setSelectedOptions] = useState<Map<number, number>>(
    () => {
      const initial = new Map<number, number>();
      options.forEach((opt) => {
        if (opt.isDefault) {
          initial.set(opt.id, opt.defaultQty || 1);
        }
      });
      return initial;
    }
  );

  const quantityGroups = optionGroups.filter((g) => g.typeLt === "quantity");
  const switchGroups = optionGroups.filter((g) => g.typeLt === "switch");
  const addonGroups = optionGroups.filter((g) => g.typeLt === "addon");

  const totalPrice = useMemo(() => {
    let total = plan.basePriceCents;
    selectedOptions.forEach((qty, optId) => {
      const option = options.find((o) => o.id === optId);
      if (option) {
        total += option.unitPriceCents * qty;
      }
    });
    return total;
  }, [plan.basePriceCents, selectedOptions, options]);

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString("lt-LT", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const updateQuantity = (optionId: number, delta: number) => {
    const option = options.find((o) => o.id === optionId);
    if (!option) return;

    setSelectedOptions((prev) => {
      const newMap = new Map(prev);
      const current = prev.get(optionId) || option.defaultQty || 1;
      const next = Math.max(
        option.minQty || 1,
        Math.min(option.maxQty || 100, current + delta)
      );
      newMap.set(optionId, next);
      return newMap;
    });
  };

  const toggleSwitch = (groupId: number, optionId: number) => {
    const groupOptions = options.filter((o) => o.groupId === groupId);
    setSelectedOptions((prev) => {
      const newMap = new Map(prev);
      groupOptions.forEach((o) => newMap.delete(o.id));
      newMap.set(optionId, 1);
      return newMap;
    });
  };

  const toggleAddon = (optionId: number, checked: boolean) => {
    setSelectedOptions((prev) => {
      const newMap = new Map(prev);
      if (checked) {
        newMap.set(optionId, 1);
      } else {
        newMap.delete(optionId);
      }
      return newMap;
    });
  };

  const handleGetQuote = () => {
    const config: PlanConfig = {
      planId: plan.id,
      selectedOptions: Array.from(selectedOptions.entries()).map(
        ([optionId, quantity]) => ({ optionId, quantity })
      ),
    };
    onGetQuote(plan, config);
  };

  return (
    <Card
      className={cn(
        "relative flex flex-col overflow-visible transition-all duration-300 h-full",
        plan.isHighlighted && "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary"
      )}
      data-testid={`card-plan-${plan.id}`}
    >
      {plan.isHighlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
            <Sparkles className="h-3 w-3" />
            Populiariausias
          </div>
        </div>
      )}

      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">{plan.nameLt}</CardTitle>
        <CardDescription>{plan.taglineLt}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-sm text-muted-foreground">nuo</span>
            <span className="text-4xl font-bold">{formatPrice(plan.basePriceCents)}</span>
            <span className="text-lg text-muted-foreground">€</span>
          </div>
        </div>

        {!isExpanded && (
          <div className="mb-6 flex-1 space-y-3">
            {plan.descriptionLt?.split("\n").map((line, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{line}</span>
              </div>
            ))}
          </div>
        )}

        <Button
          className="w-full gap-2 mt-auto"
          variant={plan.isHighlighted ? "default" : "outline"}
          onClick={onToggleExpand}
          data-testid={`button-select-plan-${plan.id}`}
        >
          Pasirinkti
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isExpanded && "rotate-180"
            )}
          />
        </Button>

        <div
          className={cn(
            "grid transition-all duration-300",
            isExpanded ? "mt-6 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <div className="space-y-6 border-t pt-6">
              {quantityGroups.map((group) => {
                const groupOptions = options.filter((o) => o.groupId === group.id);
                return (
                  <div key={group.id}>
                    <Label className="mb-3 block font-medium">{group.titleLt}</Label>
                    <div className="space-y-3">
                      {groupOptions.map((option) => (
                        <div
                          key={option.id}
                          className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 p-3"
                        >
                          <div className="flex-1">
                            <div className="font-medium inline-flex items-center">
                              {option.labelLt}
                              {option.tooltipEnabled && (
                                <InfoTooltip
                                  text={option.tooltipText}
                                  link={option.tooltipLink}
                                  image={option.tooltipImage}
                                />
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatPrice(option.unitPriceCents)} € / vnt.
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(option.id, -1)}
                              disabled={(selectedOptions.get(option.id) || 1) <= (option.minQty || 1)}
                              data-testid={`button-qty-minus-${option.id}`}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-medium">
                              {selectedOptions.get(option.id) || option.defaultQty || 1}
                            </span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(option.id, 1)}
                              disabled={(selectedOptions.get(option.id) || 1) >= (option.maxQty || 100)}
                              data-testid={`button-qty-plus-${option.id}`}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {switchGroups.map((group) => {
                const groupOptions = options.filter((o) => o.groupId === group.id);
                const selectedId = groupOptions.find((o) =>
                  selectedOptions.has(o.id)
                )?.id;
                return (
                  <div key={group.id}>
                    <Label className="mb-3 block font-medium">{group.titleLt}</Label>
                    <RadioGroup
                      value={selectedId?.toString()}
                      onValueChange={(val) => toggleSwitch(group.id, parseInt(val))}
                    >
                      <div className="space-y-2">
                        {groupOptions.map((option) => (
                          <div
                            key={option.id}
                            className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3"
                          >
                            <RadioGroupItem
                              value={option.id.toString()}
                              id={`switch-${option.id}`}
                              data-testid={`radio-switch-${option.id}`}
                            />
                            <Label
                              htmlFor={`switch-${option.id}`}
                              className="flex flex-1 cursor-pointer items-center justify-between"
                            >
                              <span className="inline-flex items-center">
                                {option.labelLt}
                                {option.tooltipEnabled && (
                                  <InfoTooltip
                                    text={option.tooltipText}
                                    link={option.tooltipLink}
                                    image={option.tooltipImage}
                                  />
                                )}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                +{formatPrice(option.unitPriceCents)} €
                              </span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                );
              })}

              {addonGroups.map((group) => {
                const groupOptions = options.filter((o) => o.groupId === group.id);
                return (
                  <div key={group.id}>
                    <Label className="mb-3 block font-medium">{group.titleLt}</Label>
                    <div className="space-y-2">
                      {groupOptions.map((option) => (
                        <div
                          key={option.id}
                          className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3"
                        >
                          <Checkbox
                            id={`addon-${option.id}`}
                            checked={selectedOptions.has(option.id)}
                            onCheckedChange={(checked) =>
                              toggleAddon(option.id, checked as boolean)
                            }
                            data-testid={`checkbox-addon-${option.id}`}
                          />
                          <Label
                            htmlFor={`addon-${option.id}`}
                            className="flex flex-1 cursor-pointer items-center justify-between"
                          >
                            <span className="inline-flex items-center">
                              {option.labelLt}
                              {option.tooltipEnabled && (
                                <InfoTooltip
                                  text={option.tooltipText}
                                  link={option.tooltipLink}
                                  image={option.tooltipImage}
                                />
                              )}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              +{formatPrice(option.unitPriceCents)} €
                            </span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              <div className="rounded-lg bg-primary/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Bendra kaina:
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(totalPrice)}
                    </span>
                    <span className="text-sm text-muted-foreground">€</span>
                  </div>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleGetQuote}
                data-testid={`button-get-quote-${plan.id}`}
              >
                Gauti pasiūlymą
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
