import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  Calendar,
  Search,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface Transaction {
  id: string;
  type: 'purchase' | 'usage' | 'refund' | 'bonus';
  amount: number;
  balance: number;
  description: string;
  createdAt: string;
  metadata?: {
    toolUsed?: string;
    orderId?: string;
    jobId?: string;
  };
}

export default function PointsHistory() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Fetch transactions
  useEffect(() => {
    loadTransactions();
  }, []);

  // Filter transactions
  useEffect(() => {
    let filtered = [...transactions];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((t) => t.type === filterType);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const daysAgo = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

      filtered = filtered.filter(
        (t) => new Date(t.createdAt) >= cutoffDate
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, filterType, searchTerm, dateRange]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      // Mock data for now - replace with actual API call
      const mockTransactions: Transaction[] = [
        {
          id: 'txn_001',
          type: 'purchase',
          amount: 4000,
          balance: 4000,
          description: 'Purchased Starter Plan',
          createdAt: new Date().toISOString(),
          metadata: { orderId: 'ord_123' },
        },
        {
          id: 'txn_002',
          type: 'usage',
          amount: -100,
          balance: 3900,
          description: 'Face Swap Operation',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          metadata: { toolUsed: 'face-swap', jobId: 'job_456' },
        },
        {
          id: 'txn_003',
          type: 'usage',
          amount: -300,
          balance: 3600,
          description: 'AI Avatar Generation',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          metadata: { toolUsed: 'avatar', jobId: 'job_457' },
        },
        {
          id: 'txn_004',
          type: 'bonus',
          amount: 500,
          balance: 4100,
          description: 'Referral Bonus',
          createdAt: new Date(Date.now() - 259200000).toISOString(),
        },
      ];

      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const escapeCSV = (field: string | number) => {
      const str = String(field);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
  const exportToCSV = () => {
    const escapeCSV = (field: string | number) => {
      const str = String(field);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csv = [
      ['Date', 'Type', 'Description', 'Amount', 'Balance'],
      ...filteredTransactions.map((t) => [
        new Date(t.createdAt).toLocaleDateString(),
        t.type,
        t.description,
        t.amount,
        t.balance,
      ]),
    ]
      .map((row) => row.map(escapeCSV).join(','))
      .join('\n');

  const stats = {
    totalEarned: transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0),
    totalSpent: Math.abs(
      transactions
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0)
    ),
    currentBalance: user?.credits || 0,
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
      case 'bonus':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'usage':
        return <TrendingDown className="w-5 h-5 text-orange-500" />;
      case 'refund':
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      default:
        return <Coins className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'bg-green-500/20 text-green-400';
      case 'usage':
        return 'bg-orange-500/20 text-orange-400';
      case 'refund':
        return 'bg-blue-500/20 text-blue-400';
      case 'bonus':
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Points History</h1>
            <p className="text-muted-foreground">
              Track your credit purchases, usage, and transactions
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="glass-card p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">Current Balance</span>
                <Coins className="w-5 h-5 text-primary" />
              </div>
              <div className="text-3xl font-bold text-primary">
                {stats.currentBalance.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">credits available</div>
            </Card>

            <Card className="glass-card p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">Total Earned</span>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-green-500">
                +{stats.totalEarned.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">from purchases & bonuses</div>
            </Card>

            <Card className="glass-card p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">Total Spent</span>
                <TrendingDown className="w-5 h-5 text-orange-500" />
              </div>
              <div className="text-3xl font-bold text-orange-500">
                -{stats.totalSpent.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">on tool operations</div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="glass-card p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-muted border border-border focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary focus:outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="purchase">Purchases</option>
                  <option value="usage">Usage</option>
                  <option value="refund">Refunds</option>
                  <option value="bonus">Bonuses</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary focus:outline-none"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="all">All time</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <span className="text-sm text-muted-foreground">
                Showing {filteredTransactions.length} of {transactions.length} transactions
              </span>
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </Card>

          {/* Transactions List */}
          <Card className="glass-card p-6">
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-muted-foreground mt-4">Loading transactions...</p>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <Coins className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">No transactions found</p>
                </div>
              ) : (
                filteredTransactions.map((transaction) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{transaction.description}</h4>
                          <Badge className={`text-xs ${getTypeColor(transaction.type)}`}>
                            {transaction.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{new Date(transaction.createdAt).toLocaleString()}</span>
                          <span>ID: {transaction.id}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${
                          transaction.amount > 0 ? 'text-green-500' : 'text-orange-500'
                        }`}
                      >
                        {transaction.amount > 0 ? '+' : ''}
                        {transaction.amount.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Balance: {transaction.balance.toLocaleString()}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
