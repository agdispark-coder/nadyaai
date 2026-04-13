'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Sun,
  UtensilsCrossed,
  Moon,
  Apple,
  Plus,
  Trash2,
  Loader2,
  Save,
  Camera,
  Sparkles,
  ScanLine,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Leaf,
  GlassWater,
  X,
  Check,
} from 'lucide-react';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface FoodItem {
  name: string;
  amount: string;
  unit: string;
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
}

const MEAL_TYPES: { key: MealType; label: string; icon: React.ComponentType<{ className?: string }>; gradient: string; bg: string }[] = [
  { key: 'breakfast', label: 'Breakfast', icon: Sun, gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/10' },
  { key: 'lunch', label: 'Lunch', icon: UtensilsCrossed, gradient: 'from-orange-500 to-red-500', bg: 'bg-orange-500/10' },
  { key: 'dinner', label: 'Dinner', icon: Moon, gradient: 'from-indigo-500 to-purple-500', bg: 'bg-indigo-500/10' },
  { key: 'snack', label: 'Snack', icon: Apple, gradient: 'from-green-500 to-emerald-500', bg: 'bg-green-500/10' },
];

const UNITS = ['g', 'ml', 'oz', 'cup', 'tbsp', 'tsp', 'piece', 'serving'];

const emptyFoodItem = (): FoodItem => ({
  name: '',
  amount: '',
  unit: 'g',
  calories: '',
  protein: '',
  carbs: '',
  fats: '',
});

export default function NewMealPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [type, setType] = useState<MealType | ''>('');
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [fiber, setFiber] = useState('');
  const [water, setWater] = useState('');
  const [items, setItems] = useState<FoodItem[]>([emptyFoodItem()]);
  const [notes, setNotes] = useState('');

  // AI Scan state
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);

  const updateItem = (index: number, field: keyof FoodItem, value: string) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addItem = () => {
    setItems(prev => [...prev, emptyFoodItem()]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setScanSuccess(false);
    setError('');

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const res = await fetch('/api/meals/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64 }),
          });

          if (res.ok) {
            const data = await res.json();
            const scan = data.scan;

            // Auto-fill totals
            if (scan.totalCalories) setCalories(String(scan.totalCalories));
            if (scan.totalProtein) setProtein(String(scan.totalProtein));
            if (scan.totalCarbs) setCarbs(String(scan.totalCarbs));
            if (scan.totalFats) setFats(String(scan.totalFats));

            // Auto-fill food items
            if (scan.items && scan.items.length > 0) {
              setItems(
                scan.items.map(
                  (it: { name: string; amount?: number; unit?: string; calories?: number; protein?: number; carbs?: number; fats?: number }) => ({
                    name: it.name,
                    amount: it.amount ? String(it.amount) : '',
                    unit: it.unit || 'g',
                    calories: it.calories ? String(it.calories) : '',
                    protein: it.protein ? String(it.protein) : '',
                    carbs: it.carbs ? String(it.carbs) : '',
                    fats: it.fats ? String(it.fats) : '',
                  })
                )
              );
            }

            // Auto-detect name from first item
            if (!name && scan.items?.[0]?.name) {
              setName(scan.items[0].name);
            }

            setScanSuccess(true);
          } else {
            const data = await res.json();
            setError(data.error || 'Failed to scan food');
          }
        } catch {
          setError('Failed to connect to AI service');
        } finally {
          setScanning(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setScanning(false);
      setError('Failed to read image');
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) {
      setError('Please select a meal type');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const body: Record<string, unknown> = {
        type,
        name: name.trim() || undefined,
        calories: calories ? parseInt(calories, 10) : 0,
        protein: protein ? parseFloat(protein) : 0,
        carbs: carbs ? parseFloat(carbs) : 0,
        fats: fats ? parseFloat(fats) : 0,
        fiber: fiber ? parseFloat(fiber) : 0,
        water: water ? parseFloat(water) : 0,
        notes: notes.trim() || undefined,
        aiScanned: scanSuccess,
        items: items
          .filter(it => it.name.trim())
          .map(it => ({
            name: it.name.trim(),
            amount: it.amount ? parseFloat(it.amount) : undefined,
            unit: it.unit || 'g',
            calories: it.calories ? parseInt(it.calories, 10) : 0,
            protein: it.protein ? parseFloat(it.protein) : 0,
            carbs: it.carbs ? parseFloat(it.carbs) : 0,
            fats: it.fats ? parseFloat(it.fats) : 0,
          })),
      };

      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push('/meals');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save meal');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="py-6 space-y-5 animate-fade-in">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleScan}
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/meals"
          className="w-9 h-9 rounded-xl glass-card flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-bold text-white">New Meal</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type Selector */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Meal Type *
          </label>
          <div className="grid grid-cols-4 gap-2">
            {MEAL_TYPES.map(t => {
              const Icon = t.icon;
              const isActive = type === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setType(t.key)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all ${
                    isActive
                      ? `${t.bg} border border-purple-500/40 shadow-lg shadow-purple-500/10`
                      : 'glass-card hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <span className={`text-[11px] font-medium ${isActive ? 'text-white' : 'text-gray-400'}`}>
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Meal Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g., Grilled Chicken Salad"
            className="w-full px-4 py-3 rounded-xl bg-gray-900/80 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
          />
        </div>

        {/* AI Food Scan */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-purple-400" />
            AI Food Scan
          </label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={scanning}
            className="w-full py-4 rounded-2xl border border-dashed border-gray-700 flex flex-col items-center justify-center gap-2 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {scanning ? (
              <>
                <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center animate-pulse">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
                <p className="text-sm font-medium text-purple-400">Scanning your food...</p>
                <p className="text-xs text-gray-500">AI is analyzing the image</p>
              </>
            ) : scanSuccess ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-sm font-medium text-green-400">Scan complete!</p>
                <p className="text-xs text-gray-500">Nutrition data has been auto-filled</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-purple-400" />
                </div>
                <p className="text-sm font-medium text-gray-300">Scan with AI</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <ScanLine className="w-3 h-3" />
                  Take a photo to auto-fill nutrition
                </p>
              </>
            )}
          </button>
        </div>

        {/* Manual Nutrition Entry */}
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-3 h-3 text-orange-400" />
            Nutrition
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {/* Calories */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-500 flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" />
                Calories
              </label>
              <input
                type="number"
                value={calories}
                onChange={e => setCalories(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2.5 rounded-xl bg-gray-900/80 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
              />
            </div>
            {/* Protein */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-500 flex items-center gap-1">
                <Beef className="w-3 h-3 text-purple-400" />
                Protein (g)
              </label>
              <input
                type="number"
                value={protein}
                onChange={e => setProtein(e.target.value)}
                placeholder="0"
                min="0"
                step="0.1"
                className="w-full px-3 py-2.5 rounded-xl bg-gray-900/80 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
              />
            </div>
            {/* Carbs */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-500 flex items-center gap-1">
                <Wheat className="w-3 h-3 text-amber-400" />
                Carbs (g)
              </label>
              <input
                type="number"
                value={carbs}
                onChange={e => setCarbs(e.target.value)}
                placeholder="0"
                min="0"
                step="0.1"
                className="w-full px-3 py-2.5 rounded-xl bg-gray-900/80 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
              />
            </div>
            {/* Fats */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-500 flex items-center gap-1">
                <Droplets className="w-3 h-3 text-green-400" />
                Fats (g)
              </label>
              <input
                type="number"
                value={fats}
                onChange={e => setFats(e.target.value)}
                placeholder="0"
                min="0"
                step="0.1"
                className="w-full px-3 py-2.5 rounded-xl bg-gray-900/80 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
              />
            </div>
            {/* Fiber */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-500 flex items-center gap-1">
                <Leaf className="w-3 h-3 text-teal-400" />
                Fiber (g)
              </label>
              <input
                type="number"
                value={fiber}
                onChange={e => setFiber(e.target.value)}
                placeholder="0"
                min="0"
                step="0.1"
                className="w-full px-3 py-2.5 rounded-xl bg-gray-900/80 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
              />
            </div>
            {/* Water */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-500 flex items-center gap-1">
                <GlassWater className="w-3 h-3 text-cyan-400" />
                Water (ml)
              </label>
              <input
                type="number"
                value={water}
                onChange={e => setWater(e.target.value)}
                placeholder="0"
                min="0"
                step="50"
                className="w-full px-3 py-2.5 rounded-xl bg-gray-900/80 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Food Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <UtensilsCrossed className="w-3 h-3" />
              Food Items
            </label>
            <span className="text-xs text-gray-600">
              {items.filter(it => it.name.trim()).length} added
            </span>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="glass-card rounded-2xl p-4 space-y-3 animate-slide-up"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">
                    Item {index + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Name */}
                <input
                  type="text"
                  value={item.name}
                  onChange={e => updateItem(index, 'name', e.target.value)}
                  placeholder="Food item name"
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-900/80 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                />

                {/* Amount + Unit */}
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={item.amount}
                    onChange={e => updateItem(index, 'amount', e.target.value)}
                    placeholder="Amount"
                    min="0"
                    className="flex-1 px-3 py-2.5 rounded-xl bg-gray-900/80 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-all"
                  />
                  <select
                    value={item.unit}
                    onChange={e => updateItem(index, 'unit', e.target.value)}
                    className="w-24 px-3 py-2.5 rounded-xl bg-gray-900/80 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all appearance-none cursor-pointer"
                  >
                    {UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                {/* Macros */}
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-600 mb-1 block">Cal</label>
                    <input
                      type="number"
                      value={item.calories}
                      onChange={e => updateItem(index, 'calories', e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full px-2.5 py-2 rounded-lg bg-gray-900/80 border border-white/10 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-all text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-600 mb-1 block">P(g)</label>
                    <input
                      type="number"
                      value={item.protein}
                      onChange={e => updateItem(index, 'protein', e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.1"
                      className="w-full px-2.5 py-2 rounded-lg bg-gray-900/80 border border-white/10 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-all text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-600 mb-1 block">C(g)</label>
                    <input
                      type="number"
                      value={item.carbs}
                      onChange={e => updateItem(index, 'carbs', e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.1"
                      className="w-full px-2.5 py-2 rounded-lg bg-gray-900/80 border border-white/10 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-all text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-600 mb-1 block">F(g)</label>
                    <input
                      type="number"
                      value={item.fats}
                      onChange={e => updateItem(index, 'fats', e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.1"
                      className="w-full px-2.5 py-2 rounded-lg bg-gray-900/80 border border-white/10 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-all text-center"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Food Item Button */}
          <button
            type="button"
            onClick={addItem}
            className="w-full py-3 rounded-xl border border-dashed border-gray-700 text-gray-500 text-sm font-medium flex items-center justify-center gap-2 hover:border-purple-500/40 hover:text-purple-400 hover:bg-purple-500/5 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Add Food Item
          </button>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any notes about this meal..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-gray-900/80 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center animate-slide-down flex items-center justify-center gap-2">
            <X className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving || scanning}
          className="w-full py-3.5 gradient-bg rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Meal
            </>
          )}
        </button>

        <div className="h-4" />
      </form>
    </div>
  );
}
