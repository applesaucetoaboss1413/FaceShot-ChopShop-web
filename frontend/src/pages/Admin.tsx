import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    DollarSign,
    Package,
    Users,
    TrendingUp,
    Loader2,
    LogOut,
    Zap,
    Edit,
    Save,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SKUStat {
    code: string;
    name: string;
    orderCount: number;
    avgCustomerPriceUsd: string;
    avgInternalCostUsd: string;
    avgMarginPercent: string;
}

interface AdminStats {
    skuStats: SKUStat[];
    totals: {
        orders: number;
        revenueUsd: string;
        users: number;
        activeSubscriptions: number;
    };
}

interface Plan {
    id: string;
    code: string;
    name: string;
    monthly_price_cents: number;
    included_seconds: number;
    overage_rate_per_second_cents: number;
    description: string;
    active: number;
}

interface SKU {
    id: string;
    code: string;
    name: string;
    base_credits: number;
    base_price_cents: number;
    description: string;
    active: number;
}

interface Flag {
    id: string;
    code: string;
    label: string;
    price_multiplier: number;
    price_add_flat_cents: number;
    description: string;
    active: number;
}

export default function AdminPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [stats, setStats] = useState<AdminStats | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [skus, setSKUs] = useState<SKU[]>([]);
    const [flags, setFlags] = useState<Flag[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [activeTab, setActiveTab] = useState<'stats' | 'plans' | 'skus' | 'flags'>('stats');

    useEffect(() => {
        loadAdminData();
    }, []);

    const loadAdminData = async () => {
        setIsLoading(true);

        try {
            // Load stats
            const statsResponse = await fetch('/api/admin/stats', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setStats(statsData);
            }

            // Load plans
            const plansResponse = await fetch('/api/plans', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });
            if (plansResponse.ok) {
                const plansData = await plansResponse.json();
                setPlans(plansData.plans);
            }

            // Load SKUs
            const skusResponse = await fetch('/api/skus', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });
            if (skusResponse.ok) {
                const skusData = await skusResponse.json();
                setSKUs(skusData.skus);
            }

            // Load flags
            const flagsResponse = await fetch('/api/admin/flags', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });
            if (flagsResponse.ok) {
                const flagsData = await flagsResponse.json();
                setFlags(flagsData.flags);
            }
        } catch (error) {
            toast({
                title: 'Error loading admin data',
                description: 'Please refresh and try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (type: 'plan' | 'sku' | 'flag', item: any) => {
        setEditingId(item.id);
        setEditForm({ ...item, type });
    };

    const handleSave = async () => {
        if (!editForm.id || !editForm.type) return;

        const endpoint = editForm.type === 'plan'
            ? `/api/admin/plans/${editForm.id}`
            : editForm.type === 'sku'
                ? `/api/admin/skus/${editForm.id}`
                : `/api/admin/flags/${editForm.id}`;

        try {
            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...(editForm.type === 'plan' && {
                        name: editForm.name,
                        monthly_price_usd: (editForm.monthly_price_cents / 100).toFixed(2),
                        included_seconds: editForm.included_seconds,
                        overage_rate_per_second_usd: (editForm.overage_rate_per_second_cents / 100).toFixed(2),
                        description: editForm.description,
                        active: editForm.active
                    }),
                    ...(editForm.type === 'sku' && {
                        name: editForm.name,
                        base_credits: editForm.base_credits,
                        base_price_usd: (editForm.base_price_cents / 100).toFixed(2),
                        description: editForm.description,
                        active: editForm.active
                    }),
                    ...(editForm.type === 'flag' && {
                        label: editForm.label,
                        price_multiplier: editForm.price_multiplier,
                        price_add_flat_usd: (editForm.price_add_flat_cents / 100).toFixed(2),
                        description: editForm.description,
                        active: editForm.active
                    })
                })
            });

            if (response.ok) {
                toast({
                    title: 'Updated successfully',
                    description: `${editForm.type} has been updated.`,
                });
                setEditingId(null);
                setEditForm({});
                loadAdminData();
            } else {
                throw new Error('Update failed');
            }
        } catch (error) {
            toast({
                title: 'Update failed',
                description: 'Unable to save changes. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Top Bar */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <Zap className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="font-bold font-display">
                            <span className="gradient-text">Admin</span> Panel
                        </span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <Link to="/dashboard">
                            <Button variant="ghost" size="sm">
                                Dashboard
                            </Button>
                        </Link>
                        <Link to="/create">
                            <Button variant="ghost" size="sm">
                                Create
                            </Button>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            aria-label="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="pt-24 pb-12">
                <div className="container mx-auto px-4">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8"
                        >
                            <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
                            <p className="text-muted-foreground">
                                Manage pricing, SKUs, and view platform statistics
                            </p>
                        </motion.div>

                        {/* Tabs */}
                        <div className="flex gap-2 mb-6 overflow-x-auto">
                            <Button
                                variant={activeTab === 'stats' ? 'default' : 'ghost'}
                                onClick={() => setActiveTab('stats')}
                            >
                                Statistics
                            </Button>
                            <Button
                                variant={activeTab === 'plans' ? 'default' : 'ghost'}
                                onClick={() => setActiveTab('plans')}
                            >
                                Plans
                            </Button>
                            <Button
                                variant={activeTab === 'skus' ? 'default' : 'ghost'}
                                onClick={() => setActiveTab('skus')}
                            >
                                SKUs
                            </Button>
                            <Button
                                variant={activeTab === 'flags' ? 'default' : 'ghost'}
                                onClick={() => setActiveTab('flags')}
                            >
                                Flags
                            </Button>
                        </div>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <>
                                {/* Statistics Tab */}
                                {activeTab === 'stats' && stats && (
                                    <div className="space-y-6">
                                        {/* Summary Cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="glass-card p-6">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <DollarSign className="w-5 h-5 text-green-400" />
                                                    <span className="text-sm text-muted-foreground">Revenue</span>
                                                </div>
                                                <div className="text-2xl font-bold">${stats.totals.revenueUsd}</div>
                                            </div>
                                            <div className="glass-card p-6">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Package className="w-5 h-5 text-blue-400" />
                                                    <span className="text-sm text-muted-foreground">Orders</span>
                                                </div>
                                                <div className="text-2xl font-bold">{stats.totals.orders}</div>
                                            </div>
                                            <div className="glass-card p-6">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Users className="w-5 h-5 text-purple-400" />
                                                    <span className="text-sm text-muted-foreground">Users</span>
                                                </div>
                                                <div className="text-2xl font-bold">{stats.totals.users}</div>
                                            </div>
                                            <div className="glass-card p-6">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <TrendingUp className="w-5 h-5 text-orange-400" />
                                                    <span className="text-sm text-muted-foreground">Active Subs</span>
                                                </div>
                                                <div className="text-2xl font-bold">{stats.totals.activeSubscriptions}</div>
                                            </div>
                                        </div>

                                        {/* SKU Performance Table */}
                                        <div className="glass-card p-6">
                                            <h2 className="text-lg font-semibold mb-4">SKU Performance</h2>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b border-border">
                                                            <th className="text-left py-3 px-2">SKU</th>
                                                            <th className="text-left py-3 px-2">Name</th>
                                                            <th className="text-right py-3 px-2">Orders</th>
                                                            <th className="text-right py-3 px-2">Avg Price</th>
                                                            <th className="text-right py-3 px-2">Avg Cost</th>
                                                            <th className="text-right py-3 px-2">Avg Margin</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {stats.skuStats.map((sku) => (
                                                            <tr key={sku.code} className="border-b border-border/50">
                                                                <td className="py-3 px-2 font-mono text-xs">{sku.code}</td>
                                                                <td className="py-3 px-2">{sku.name}</td>
                                                                <td className="py-3 px-2 text-right">{sku.orderCount}</td>
                                                                <td className="py-3 px-2 text-right">${sku.avgCustomerPriceUsd}</td>
                                                                <td className="py-3 px-2 text-right">${sku.avgInternalCostUsd}</td>
                                                                <td className="py-3 px-2 text-right text-green-400">{sku.avgMarginPercent}%</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Plans Tab */}
                                {activeTab === 'plans' && (
                                    <div className="space-y-4">
                                        {plans.map((plan) => (
                                            <div key={plan.id} className="glass-card p-6">
                                                {editingId === plan.id ? (
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <Label>Name</Label>
                                                                <Input
                                                                    value={editForm.name || ''}
                                                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label>Monthly Price (USD)</Label>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={(editForm.monthly_price_cents / 100).toFixed(2)}
                                                                    onChange={(e) => setEditForm({ ...editForm, monthly_price_cents: Math.round(parseFloat(e.target.value) * 100) })}
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label>Included Seconds</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={editForm.included_seconds || 0}
                                                                    onChange={(e) => setEditForm({ ...editForm, included_seconds: parseInt(e.target.value) })}
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label>Overage Rate (USD/sec)</Label>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={(editForm.overage_rate_per_second_cents / 100).toFixed(2)}
                                                                    onChange={(e) => setEditForm({ ...editForm, overage_rate_per_second_cents: Math.round(parseFloat(e.target.value) * 100) })}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <Label>Description</Label>
                                                            <Input
                                                                value={editForm.description || ''}
                                                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button onClick={handleSave} size="sm">
                                                                <Save className="w-4 h-4 mr-1" /> Save
                                                            </Button>
                                                            <Button onClick={handleCancel} variant="outline" size="sm">
                                                                <X className="w-4 h-4 mr-1" /> Cancel
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <h3 className="text-lg font-semibold">{plan.name}</h3>
                                                                <span className="text-sm text-muted-foreground">{plan.code}</span>
                                                                {plan.active === 0 && (
                                                                    <span className="text-xs px-2 py-1 rounded-full bg-destructive/20 text-destructive">
                                                                        Inactive
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-muted-foreground mb-2">{plan.description}</p>
                                                            <div className="flex gap-4 text-sm">
                                                                <span>Price: ${(plan.monthly_price_cents / 100).toFixed(2)}/mo</span>
                                                                <span>Seconds: {plan.included_seconds}</span>
                                                                <span>Overage: ${(plan.overage_rate_per_second_cents / 100).toFixed(2)}/sec</span>
                                                            </div>
                                                        </div>
                                                        <Button onClick={() => handleEdit('plan', plan)} size="sm" variant="outline">
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* SKUs Tab */}
                                {activeTab === 'skus' && (
                                    <div className="space-y-4">
                                        {skus.map((sku) => (
                                            <div key={sku.id} className="glass-card p-6">
                                                {editingId === sku.id ? (
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <Label>Name</Label>
                                                                <Input
                                                                    value={editForm.name || ''}
                                                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label>Base Price (USD)</Label>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={(editForm.base_price_cents / 100).toFixed(2)}
                                                                    onChange={(e) => setEditForm({ ...editForm, base_price_cents: Math.round(parseFloat(e.target.value) * 100) })}
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label>Base Credits</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={editForm.base_credits || 0}
                                                                    onChange={(e) => setEditForm({ ...editForm, base_credits: parseInt(e.target.value) })}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <Label>Description</Label>
                                                            <Input
                                                                value={editForm.description || ''}
                                                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button onClick={handleSave} size="sm">
                                                                <Save className="w-4 h-4 mr-1" /> Save
                                                            </Button>
                                                            <Button onClick={handleCancel} variant="outline" size="sm">
                                                                <X className="w-4 h-4 mr-1" /> Cancel
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <h3 className="text-lg font-semibold">{sku.name}</h3>
                                                                <span className="text-sm font-mono text-muted-foreground">{sku.code}</span>
                                                                {sku.active === 0 && (
                                                                    <span className="text-xs px-2 py-1 rounded-full bg-destructive/20 text-destructive">
                                                                        Inactive
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-muted-foreground mb-2">{sku.description}</p>
                                                            <div className="flex gap-4 text-sm">
                                                                <span>Price: ${(sku.base_price_cents / 100).toFixed(2)}</span>
                                                                <span>Credits: {sku.base_credits}</span>
                                                            </div>
                                                        </div>
                                                        <Button onClick={() => handleEdit('sku', sku)} size="sm" variant="outline">
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Flags Tab */}
                                {activeTab === 'flags' && (
                                    <div className="space-y-4">
                                        {flags.map((flag) => (
                                            <div key={flag.id} className="glass-card p-6">
                                                {editingId === flag.id ? (
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <Label>Label</Label>
                                                                <Input
                                                                    value={editForm.label || ''}
                                                                    onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label>Price Multiplier</Label>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={editForm.price_multiplier || 1.0}
                                                                    onChange={(e) => setEditForm({ ...editForm, price_multiplier: parseFloat(e.target.value) })}
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label>Flat Addition (USD)</Label>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={(editForm.price_add_flat_cents / 100).toFixed(2)}
                                                                    onChange={(e) => setEditForm({ ...editForm, price_add_flat_cents: Math.round(parseFloat(e.target.value) * 100) })}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <Label>Description</Label>
                                                            <Input
                                                                value={editForm.description || ''}
                                                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button onClick={handleSave} size="sm">
                                                                <Save className="w-4 h-4 mr-1" /> Save
                                                            </Button>
                                                            <Button onClick={handleCancel} variant="outline" size="sm">
                                                                <X className="w-4 h-4 mr-1" /> Cancel
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <h3 className="text-lg font-semibold">{flag.label}</h3>
                                                                <span className="text-sm font-mono text-muted-foreground">{flag.code}</span>
                                                                {flag.active === 0 && (
                                                                    <span className="text-xs px-2 py-1 rounded-full bg-destructive/20 text-destructive">
                                                                        Inactive
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-muted-foreground mb-2">{flag.description}</p>
                                                            <div className="flex gap-4 text-sm">
                                                                <span>Multiplier: {flag.price_multiplier}×</span>
                                                                <span>Flat Add: ${(flag.price_add_flat_cents / 100).toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                        <Button onClick={() => handleEdit('flag', flag)} size="sm" variant="outline">
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
