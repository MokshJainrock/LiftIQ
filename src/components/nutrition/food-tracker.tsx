"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FoodEntry } from "@/types";
import {
  addFoodEntry,
  deleteFoodEntry,
  getTodayFoodCalories,
  getTodayFoodEntries,
  fetchFoodLog,
} from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  X,
  Trash2,
  Apple,
  Coffee,
  Sun,
  Moon,
  Cookie,
  UtensilsCrossed,
  Search,
  Loader2,
  Zap,
  Scale,
  Camera,
  Upload,
  Sparkles,
  Check,
  Pencil,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FoodSearchItem {
  fdcId: number;
  name: string;
  brand: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: number | null;
  servingSizeUnit: string | null;
}

interface ScannedFoodItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: "high" | "medium" | "low";
}

/** Read a file, downscale to <=1024px, and return a JPEG data URL to keep the
 *  payload to the vision API small and fast. */
async function fileToCompressedDataURL(
  file: File,
  maxDim = 1024,
  quality = 0.8
): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new window.Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("decode failed"));
    i.src = dataUrl;
  });

  let { width, height } = img;
  if (width >= height && width > maxDim) {
    height = Math.round((height * maxDim) / width);
    width = maxDim;
  } else if (height > width && height > maxDim) {
    width = Math.round((width * maxDim) / height);
    height = maxDim;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

const MEAL_OPTIONS = [
  { value: "breakfast" as const, label: "Breakfast", icon: Coffee },
  { value: "lunch" as const, label: "Lunch", icon: Sun },
  { value: "dinner" as const, label: "Dinner", icon: Moon },
  { value: "snack" as const, label: "Snack", icon: Cookie },
];

const QUICK_FOODS = [
  { name: "Banana", calories: 105, protein: 1.3, carbs: 27, fat: 0.4, servingSize: 118, servingUnit: "g" },
  { name: "Apple", calories: 95, protein: 0.5, carbs: 25, fat: 0.3, servingSize: 182, servingUnit: "g" },
  { name: "Chicken Breast (6oz)", calories: 280, protein: 53, carbs: 0, fat: 6, servingSize: 170, servingUnit: "g" },
  { name: "Rice (1 cup)", calories: 206, protein: 4.3, carbs: 45, fat: 0.4, servingSize: 158, servingUnit: "g" },
  { name: "Eggs (2)", calories: 156, protein: 13, carbs: 1.1, fat: 11, servingSize: 100, servingUnit: "g" },
  { name: "Protein Shake", calories: 200, protein: 30, carbs: 10, fat: 3, servingSize: 350, servingUnit: "ml" },
  { name: "Greek Yogurt", calories: 130, protein: 17, carbs: 6, fat: 4, servingSize: 170, servingUnit: "g" },
  { name: "Oatmeal (1 cup)", calories: 154, protein: 5, carbs: 27, fat: 2.6, servingSize: 234, servingUnit: "g" },
];

interface FoodTrackerProps {
  compact?: boolean;
  onFoodChange?: () => void;
}

export function FoodTracker({ compact = false, onFoodChange }: FoodTrackerProps) {
  const [todayCalories, setTodayCalories] = useState(0);
  const [todayEntries, setTodayEntries] = useState<FoodEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const refreshLocal = () => {
    setTodayCalories(getTodayFoodCalories());
    setTodayEntries(getTodayFoodEntries());
  };

  const refresh = () => {
    refreshLocal();
    onFoodChange?.();
    (async () => {
      const log = await fetchFoodLog();
      const today = new Date().toISOString().split("T")[0];
      const todayLog = log.filter((e) => e.date === today);
      const cal = todayLog.reduce((sum, e) => sum + e.calories, 0);
      setTodayCalories(cal);
      setTodayEntries(todayLog);
      if (typeof window !== "undefined") window.dispatchEvent(new Event("food-changed"));
    })();
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (compact) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="pt-4 pb-4 md:pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] md:text-sm text-muted-foreground mb-1">
                <Apple className="h-3.5 w-3.5 text-green-400" />
                Today&apos;s Food
              </div>
              <div className="text-xl md:text-3xl font-bold">
                {todayCalories}
                <span className="text-xs md:text-base text-muted-foreground ml-1">cal</span>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px]">{todayEntries.length} items</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
          <UtensilsCrossed className="h-4 w-4 md:h-5 md:w-5 text-green-400" />
          Food Tracker
        </h3>
        <Button size="sm" onClick={() => setShowAddForm(true)} className="min-h-[36px]">
          <Plus className="h-3.5 w-3.5" />
          Add Food
        </Button>
      </div>

      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="pt-4 pb-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{todayCalories}</div>
            <div className="text-xs text-muted-foreground">calories consumed today</div>
          </div>
        </CardContent>
      </Card>

      {todayEntries.length > 0 && (
        <div className="space-y-1.5">
          {todayEntries.map((entry) => {
            const MealIcon = MEAL_OPTIONS.find((m) => m.value === entry.meal)?.icon || Apple;
            return (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MealIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{entry.name}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                      {entry.meal && <span className="capitalize">{entry.meal}</span>}
                      {entry.servings && entry.servings !== 1 && (
                        <span>· {entry.servings} serving{entry.servings !== 1 ? "s" : ""}</span>
                      )}
                      {entry.protein != null && (
                        <span className="hidden sm:inline">· P {entry.protein}g · C {entry.carbs}g · F {entry.fat}g</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-sm font-medium tabular-nums">{entry.calories} cal</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      deleteFoodEntry(entry.id);
                      refresh();
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {todayEntries.length === 0 && !showAddForm && (
        <div className="text-center py-6 text-muted-foreground">
          <Apple className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No food logged today.</p>
        </div>
      )}

      {showAddForm && <AddFoodForm onClose={() => setShowAddForm(false)} onAdded={refresh} />}

      <div className="text-center pt-1">
        <span className="text-[10px] text-muted-foreground/50">
          Food data from{" "}
          <a
            href="https://fdc.nal.usda.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-muted-foreground/70"
          >
            FoodData Central (USDA)
          </a>
        </span>
      </div>
    </div>
  );
}

function AddFoodForm({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [meal, setMeal] = useState<FoodEntry["meal"]>("snack");
  const [mode, setMode] = useState<"search" | "scan" | "manual">("search");

  // ── AI food scan state ──────────────────────────────────────────────
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanItems, setScanItems] = useState<ScannedFoodItem[]>([]);
  const [scanNote, setScanNote] = useState("");
  const [addedScanKeys, setAddedScanKeys] = useState<Set<string>>(new Set());
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  // Portion state
  const [servings, setServings] = useState("1");
  const [servingSize, setServingSize] = useState("");
  const [servingUnit, setServingUnit] = useState("g");
  // Base values per serving (search result or quick-add)
  const [baseCals, setBaseCals] = useState(0);
  const [baseProtein, setBaseProtein] = useState(0);
  const [baseCarbs, setBaseCarbs] = useState(0);
  const [baseFat, setBaseFat] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodSearchItem | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const updatePortionValues = useCallback((numServings: number, bCals: number, bProt: number, bCarb: number, bFat: number) => {
    const s = Math.max(numServings, 0);
    setCalories(Math.round(bCals * s).toString());
    setProtein((Math.round(bProt * s * 10) / 10).toString());
    setCarbs((Math.round(bCarb * s * 10) / 10).toString());
    setFat((Math.round(bFat * s * 10) / 10).toString());
  }, []);

  const handleServingsChange = (val: string) => {
    setServings(val);
    const num = parseFloat(val) || 0;
    updatePortionValues(num, baseCals, baseProtein, baseCarbs, baseFat);
  };

  const searchFoodDatabase = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/food-search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.foods ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchInput = (val: string) => {
    setSearchQuery(val);
    setSelectedFood(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchFoodDatabase(val), 350);
  };

  const selectFoodResult = (food: FoodSearchItem) => {
    setSelectedFood(food);
    setName(food.name);
    setBaseCals(food.calories);
    setBaseProtein(food.protein);
    setBaseCarbs(food.carbs);
    setBaseFat(food.fat);
    setServingSize(food.servingSize?.toString() || "100");
    setServingUnit(food.servingSizeUnit || "g");
    setServings("1");
    updatePortionValues(1, food.calories, food.protein, food.carbs, food.fat);
    setSearchResults([]);
    setSearchQuery(food.name);
  };

  const handleSubmit = () => {
    if (!name.trim() || !calories) return;
    const numServings = parseFloat(servings) || 1;
    const entry: FoodEntry = {
      id: `food-${Date.now()}`,
      name: name.trim(),
      calories: parseInt(calories) || 0,
      protein: protein ? parseFloat(protein) : undefined,
      carbs: carbs ? parseFloat(carbs) : undefined,
      fat: fat ? parseFloat(fat) : undefined,
      servingSize: servingSize ? parseFloat(servingSize) : undefined,
      servingUnit: servingUnit || undefined,
      servings: numServings,
      date: new Date().toISOString().split("T")[0],
      timestamp: Date.now(),
      meal,
    };
    addFoodEntry(entry);
    onAdded();
    onClose();
  };

  const handleQuickAdd = (food: typeof QUICK_FOODS[0]) => {
    setName(food.name);
    setBaseCals(food.calories);
    setBaseProtein(food.protein);
    setBaseCarbs(food.carbs);
    setBaseFat(food.fat);
    setServingSize(food.servingSize.toString());
    setServingUnit(food.servingUnit);
    setServings("1");
    updatePortionValues(1, food.calories, food.protein, food.carbs, food.fat);
    setMode("manual");
  };

  const runScan = async (file: File) => {
    setScanError("");
    setScanItems([]);
    setScanNote("");
    setAddedScanKeys(new Set());
    setScanLoading(true);
    try {
      const dataUrl = await fileToCompressedDataURL(file);
      setScanImage(dataUrl);
      const res = await fetch("/api/food-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setScanError(data?.error || "Couldn't analyze that image.");
        return;
      }
      const items: ScannedFoodItem[] = data.items ?? [];
      setScanItems(items);
      setScanNote(data.note || "");
      if (items.length === 0) {
        setScanError(data.note || "No food detected. Try a clearer, closer photo.");
      }
    } catch {
      setScanError("Something went wrong analyzing the image.");
    } finally {
      setScanLoading(false);
    }
  };

  const handleScanFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (file) void runScan(file);
  };

  const resetScan = () => {
    setScanImage(null);
    setScanItems([]);
    setScanError("");
    setScanNote("");
    setAddedScanKeys(new Set());
  };

  const addScannedItem = (item: ScannedFoodItem, idx: number) => {
    const entry: FoodEntry = {
      id: `food-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      name: item.name,
      calories: Math.round(item.calories),
      protein: item.protein || undefined,
      carbs: item.carbs || undefined,
      fat: item.fat || undefined,
      servings: 1,
      date: new Date().toISOString().split("T")[0],
      timestamp: Date.now(),
      meal,
    };
    addFoodEntry(entry);
    onAdded();
    setAddedScanKeys((prev) => new Set(prev).add(`${idx}-${item.name}`));
  };

  const addAllScanned = () => {
    scanItems.forEach((item, idx) => {
      if (!addedScanKeys.has(`${idx}-${item.name}`)) addScannedItem(item, idx);
    });
  };

  const editScannedItem = (item: ScannedFoodItem) => {
    setName(item.name);
    setBaseCals(item.calories);
    setBaseProtein(item.protein);
    setBaseCarbs(item.carbs);
    setBaseFat(item.fat);
    setServingSize("1");
    setServingUnit("piece");
    setServings("1");
    updatePortionValues(1, item.calories, item.protein, item.carbs, item.fat);
    setMode("manual");
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="px-4 pt-4 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Add Food</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Mode toggle */}
        <div className="flex rounded-lg bg-secondary/50 p-0.5">
          <button
            onClick={() => setMode("search")}
            className={cn(
              "flex-1 text-xs font-medium py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5",
              mode === "search"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <Search className="h-3 w-3" />
            Search
          </button>
          <button
            onClick={() => setMode("scan")}
            className={cn(
              "flex-1 text-xs font-medium py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5",
              mode === "scan"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <Sparkles className="h-3 w-3" />
            Scan
          </button>
          <button
            onClick={() => setMode("manual")}
            className={cn(
              "flex-1 text-xs font-medium py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5",
              mode === "manual"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <Plus className="h-3 w-3" />
            Manual
          </button>
        </div>

        {/* Meal type */}
        <div className="flex gap-1.5">
          {MEAL_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setMeal(value)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium transition-colors border min-h-[44px]",
                meal === value
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-secondary/30 text-muted-foreground border-transparent active:bg-secondary"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {mode === "search" ? (
          <>
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder="Search foods..."
                autoFocus
                className="w-full h-11 rounded-xl bg-secondary border border-border pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
              )}
            </div>

            {/* Search results */}
            {searchResults.length > 0 && !selectedFood && (
              <div className="max-h-52 overflow-y-auto space-y-1 rounded-lg border border-border bg-secondary/30 p-1.5">
                {searchResults.map((food) => (
                  <button
                    key={food.fdcId}
                    onClick={() => selectFoodResult(food)}
                    className="w-full text-left rounded-md px-3 py-2.5 hover:bg-primary/10 active:bg-primary/15 transition-colors"
                  >
                    <div className="text-sm font-medium truncate capitalize">
                      {food.name.toLowerCase()}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-semibold text-primary">{food.calories} cal</span>
                      <span className="text-[10px] text-muted-foreground">
                        P {food.protein}g · C {food.carbs}g · F {food.fat}g
                      </span>
                    </div>
                    {food.servingSize && (
                      <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                        per {food.servingSize} {food.servingSizeUnit}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && !selectedFood && (
              <div className="text-center py-3 text-muted-foreground text-xs">
                No results found. Try a different term or switch to manual entry.
              </div>
            )}

            {/* Selected food with portion controls */}
            {selectedFood && (
              <PortionEditor
                name={selectedFood.name}
                servingSize={servingSize}
                servingUnit={servingUnit}
                servings={servings}
                calories={calories}
                protein={protein}
                carbs={carbs}
                fat={fat}
                baseCals={baseCals}
                baseProtein={baseProtein}
                baseCarbs={baseCarbs}
                baseFat={baseFat}
                onServingsChange={handleServingsChange}
                onCaloriesChange={setCalories}
                onClear={() => {
                  setSelectedFood(null);
                  setSearchQuery("");
                  setName("");
                  setCalories("");
                  setProtein("");
                  setCarbs("");
                  setFat("");
                  setServings("1");
                }}
              />
            )}

            {/* Quick-add fallback */}
            {!selectedFood && searchQuery.length < 2 && (
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Quick Add
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_FOODS.map((food) => (
                    <button
                      key={food.name}
                      onClick={() => handleQuickAdd(food)}
                      className="text-xs bg-secondary/50 hover:bg-secondary active:bg-secondary rounded-lg px-2.5 py-1.5 text-muted-foreground"
                    >
                      {food.name} ({food.calories})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : mode === "scan" ? (
          <>
            {/* Hidden inputs: camera (mobile) + gallery/upload */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleScanFileChange}
              className="hidden"
            />
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*"
              onChange={handleScanFileChange}
              className="hidden"
            />

            {!scanImage && !scanLoading && (
              <div className="rounded-xl border border-dashed border-primary/25 bg-primary/[0.03] p-4 text-center space-y-3">
                <div className="mx-auto h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Scan your food</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Snap or upload a photo — AI estimates the calories &amp; macros.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 min-h-[44px]"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" />
                    Take Photo
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 min-h-[44px]"
                    onClick={() => uploadInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    Upload
                  </Button>
                </div>
              </div>
            )}

            {scanImage && (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={scanImage}
                  alt="Food to analyze"
                  className="w-full max-h-52 object-cover rounded-xl border border-border"
                />
                <button
                  onClick={resetScan}
                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80"
                  title="Remove photo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                {scanLoading && (
                  <div className="absolute inset-0 rounded-xl bg-black/55 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    <span className="text-xs text-white/90 font-medium">Analyzing food…</span>
                  </div>
                )}
              </div>
            )}

            {scanLoading && !scanImage && (
              <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Analyzing food…</span>
              </div>
            )}

            {scanError && !scanLoading && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                <span className="text-xs text-amber-300">{scanError}</span>
              </div>
            )}

            {scanItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-primary" />
                    Detected ({scanItems.length})
                  </div>
                  <span className="text-[11px] font-semibold text-primary tabular-nums">
                    ~{scanItems.reduce((s, it) => s + it.calories, 0)} cal total
                  </span>
                </div>

                {scanItems.map((item, idx) => {
                  const key = `${idx}-${item.name}`;
                  const added = addedScanKeys.has(key);
                  return (
                    <div
                      key={key}
                      className="rounded-xl border border-border bg-secondary/30 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold capitalize truncate">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                            {item.portion && <span>{item.portion}</span>}
                            <ConfidencePill level={item.confidence} />
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-bold text-primary tabular-nums">
                            {item.calories}
                          </div>
                          <div className="text-[9px] text-muted-foreground">cal</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                        <span>P {item.protein}g</span>
                        <span>·</span>
                        <span>C {item.carbs}g</span>
                        <span>·</span>
                        <span>F {item.fat}g</span>
                      </div>

                      <div className="flex gap-2 mt-2.5">
                        <Button
                          size="sm"
                          className="flex-1 min-h-[38px]"
                          disabled={added}
                          onClick={() => addScannedItem(item, idx)}
                        >
                          {added ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Added
                            </>
                          ) : (
                            <>
                              <Plus className="h-3.5 w-3.5" />
                              Add
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="min-h-[38px] px-3"
                          onClick={() => editScannedItem(item)}
                          title="Adjust before adding"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {scanNote && (
                  <p className="text-[10px] text-muted-foreground/70 italic px-1">
                    {scanNote}
                  </p>
                )}

                <Button
                  variant="outline"
                  className="w-full min-h-[42px]"
                  onClick={addAllScanned}
                  disabled={scanItems.every((it, idx) => addedScanKeys.has(`${idx}-${it.name}`))}
                >
                  <Plus className="h-4 w-4" />
                  Add All to {MEAL_OPTIONS.find((m) => m.value === meal)?.label}
                </Button>

                <p className="text-[9px] text-center text-muted-foreground/50">
                  AI estimates are approximate — adjust if needed.
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Manual entry with portion */}
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Food item"
              className="w-full h-11 rounded-xl bg-secondary border border-border px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            {/* Serving size row */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground block mb-1 flex items-center gap-1">
                  <Scale className="h-3 w-3" />
                  Serving Size
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    value={servingSize}
                    onChange={(e) => setServingSize(e.target.value)}
                    placeholder="100"
                    min="0"
                    className="flex-1 h-10 rounded-lg bg-secondary border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                  <select
                    value={servingUnit}
                    onChange={(e) => setServingUnit(e.target.value)}
                    className="h-10 rounded-lg bg-secondary border border-border px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                    <option value="oz">oz</option>
                    <option value="cup">cup</option>
                    <option value="tbsp">tbsp</option>
                    <option value="piece">piece</option>
                  </select>
                </div>
              </div>
              <div className="w-20">
                <label className="text-[10px] text-muted-foreground block mb-1">Servings</label>
                <input
                  type="number"
                  value={servings}
                  onChange={(e) => handleServingsChange(e.target.value)}
                  placeholder="1"
                  min="0.25"
                  step="0.25"
                  className="w-full h-10 rounded-lg bg-secondary border border-border px-3 text-sm text-center text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
            </div>

            {/* Nutrition inputs */}
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Calories</label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full h-10 rounded-lg bg-secondary border border-border px-2 text-sm text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Protein (g)</label>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full h-10 rounded-lg bg-secondary border border-border px-2 text-sm text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Carbs (g)</label>
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full h-10 rounded-lg bg-secondary border border-border px-2 text-sm text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Fat (g)</label>
                <input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full h-10 rounded-lg bg-secondary border border-border px-2 text-sm text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
            </div>

            {/* Quick-add in manual mode */}
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Quick Add
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_FOODS.map((food) => (
                  <button
                    key={food.name}
                    onClick={() => handleQuickAdd(food)}
                    className="text-xs bg-secondary/50 hover:bg-secondary active:bg-secondary rounded-lg px-2.5 py-1.5 text-muted-foreground"
                  >
                    {food.name} ({food.calories})
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {mode !== "scan" && (
          <Button onClick={handleSubmit} disabled={!name.trim() || !calories} className="w-full min-h-[44px]">
            <Plus className="h-4 w-4" />
            Add to Log
          </Button>
        )}

        <div className="text-center">
          <span className="text-[9px] text-muted-foreground/50">
            {mode === "scan"
              ? "AI food scan powered by Gemini"
              : "Food data from FoodData Central (USDA)"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function PortionEditor({
  name,
  servingSize,
  servingUnit,
  servings,
  calories,
  protein,
  carbs,
  fat,
  baseCals,
  baseProtein,
  baseCarbs,
  baseFat,
  onServingsChange,
  onCaloriesChange,
  onClear,
}: {
  name: string;
  servingSize: string;
  servingUnit: string;
  servings: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  baseCals: number;
  baseProtein: number;
  baseCarbs: number;
  baseFat: number;
  onServingsChange: (val: string) => void;
  onCaloriesChange: (val: string) => void;
  onClear: () => void;
}) {
  const PORTION_PRESETS = [0.5, 1, 1.5, 2, 3];

  return (
    <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold capitalize">{name.toLowerCase()}</div>
          {servingSize && (
            <div className="text-[10px] text-muted-foreground">
              per {servingSize} {servingUnit} serving · {baseCals} cal base
            </div>
          )}
        </div>
        <button onClick={onClear} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Portion selector */}
      <div>
        <label className="text-[10px] text-muted-foreground block mb-1.5 flex items-center gap-1">
          <Scale className="h-3 w-3" />
          How many servings?
        </label>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 flex-wrap">
            {PORTION_PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => onServingsChange(p.toString())}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors min-w-[36px]",
                  parseFloat(servings) === p
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary"
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={servings}
            onChange={(e) => onServingsChange(e.target.value)}
            min="0.25"
            step="0.25"
            className="w-16 h-8 rounded-lg bg-secondary border border-border px-2 text-xs text-center text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Calculated macros */}
      <div className="grid grid-cols-4 gap-2">
        <MacroBadge label="Calories" value={calories} unit="kcal" highlight />
        <MacroBadge label="Protein" value={protein} unit="g" />
        <MacroBadge label="Carbs" value={carbs} unit="g" />
        <MacroBadge label="Fat" value={fat} unit="g" />
      </div>

      {/* Override calories */}
      <div>
        <label className="text-[10px] text-muted-foreground">
          Adjust calories if needed
        </label>
        <input
          type="number"
          value={calories}
          onChange={(e) => onCaloriesChange(e.target.value)}
          min="0"
          className="w-full h-9 mt-1 rounded-lg bg-secondary border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
    </div>
  );
}

function ConfidencePill({ level }: { level: "high" | "medium" | "low" }) {
  const styles = {
    high: "bg-green-500/10 text-green-400 border-green-500/20",
    medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    low: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  }[level];
  return (
    <span className={cn("inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-medium capitalize", styles)}>
      {level} confidence
    </span>
  );
}

function MacroBadge({ label, value, unit, highlight }: { label: string; value: string; unit: string; highlight?: boolean }) {
  return (
    <div className={cn(
      "text-center rounded-lg py-1.5 px-1",
      highlight ? "bg-primary/10" : "bg-secondary/50"
    )}>
      <div className={cn("text-sm font-bold tabular-nums", highlight && "text-primary")}>{value || "0"}</div>
      <div className="text-[9px] text-muted-foreground">{unit}</div>
      <div className="text-[9px] text-muted-foreground">{label}</div>
    </div>
  );
}
