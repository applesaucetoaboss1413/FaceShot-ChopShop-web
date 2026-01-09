import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Coins, 
  Plus, 
  Minus, 
  Clock, 
  LogOut, 
  Zap, 
  TrendingUp,
  TrendingDown,
  History,
  Download,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  tool?: string;
  balanceAfter: number;
  createdAt: string;
}

export default function CreditsHistory() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [credits, setCredits] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalPurchased: 0,
    thisMonth: 0
  });

  useEffect(() => {
    loadCreditsData();
  }, []);

  const loadCreditsData = async () => {
    setIsLoading(true);
    try {
      // Load current balance
      const creditsResult = await api.getCredits();
      if (creditsResult.success && creditsResult.data) {
        setCredits(creditsResult.data.balance);
      }

      // Mock transaction history for now - in production this would come from backend
      // TODO: Add API endpoint for transaction history
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          type: 'credit',
          amount: 5000,
          description: 'Starter Plan Purchase',
          balanceAfter: 5000,
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
        },
        {
          id: '2',
          type: 'debit',
          amount: 100,
          description: 'Face Swap',
          tool: 'A1-IG',
          balanceAfter: 4900,
          createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
        },
        {
          id: '3',
          type: 'debit',
          amount: 300,
          description: 'Image to Video (15s)',
          tool: 'C1-15',
          balanceAfter: 4600,
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
        },
        {
          id: '4',
          type: 'credit',
          amount: 1000,
          description: 'Top-up Purchase',
          balanceAfter: 5600,
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
        },
        {
          id: '5',
          type: 'debit',
          amount: 150,
          description: 'AI Avatar Generation',
          tool: 'A2-BH',
          balanceAfter: 5450,
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ];

      setTransactions(mockTransactions);

      // Calculate stats
      const totalSpent = mockTransactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalPurchased = mockTransactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);

      const thirtyDaysAgo = Date.now() - 86400000 * 30;
      const thisMonth = mockTransactions
        .filter(t => t.type === 'debit' && new Date(t.createdAt).getTime() > thirtyDaysAgo)
        .reduce((sum, t) => sum + t.amount, 0);

      setStats({ totalSpent, totalPurchased, thisMonth });
    } catch (error) {
      console.error('Failed to load credits data:', error);
      toast({
        title: 'Error loading data',
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportHistory = () => {
    const csv = [
      ['Date', 'Type', 'Amount', 'Description', 'Balance After'].join(','),
      ...transactions.map(t => [
        new Date(t.createdAt).toLocaleDateString(),
        t.type,
        t.amount,
        t.description,
        t.balanceAfter
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credits-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold font-display">
              <span className="gradient-text">Chop</span>Shop
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted">
              <Coins className="w-4 h-4 text-primary" />
              <span className="font-semibold">{credits.toLocaleString()}</span>
              <span className="text-muted-foreground text-sm hidden sm:inline">credits</span>
            </div>

            <Link to="/pricing">
              <Button variant="glow" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Buy Credits
              </Button>
            </Link>

            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Back Button */}
          <Link to="/dashboard">
            <Button variant="ghost" className="mb-6">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <History className="w-10 h-10 text-primary" />
              Credits History
            </h1>
            <p className="text-muted-foreground text-lg">
              Track your credit purchases and usage
            </p>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                  <Coins className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{credits.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Available credits</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Month</CardTitle>
                  <TrendingDown className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.thisMonth.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Credits used</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">All Time</CardTitle>
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalPurchased.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Credits purchased</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Transactions List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>All credit purchases and usage</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={exportHistory}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Loading transactions...
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No transactions yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.type === 'credit'
                              ? 'bg-green-500/20'
                              : 'bg-red-500/20'
                          }`}>
                            {transaction.type === 'credit' ? (
                              <Plus className="w-5 h-5 text-green-500" />
                            ) : (
                              <Minus className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{transaction.description}</div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <Clock className="w-3 h-3" />
                              {new Date(transaction.createdAt).toLocaleString()}
                              {transaction.tool && (
                                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">
                                  {transaction.tool}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${
                            transaction.type === 'credit' ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {transaction.type === 'credit' ? '+' : '-'}{transaction.amount.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Balance: {transaction.balanceAfter.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
