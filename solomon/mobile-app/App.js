import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  StyleSheet,
  StatusBar,
} from 'react-native';

// Replace with your deployed Render URL (e.g., https://solomon-xxxx.onrender.com)
const API_BASE = 'https://solomon.onrender.com';

export default function App() {
  const [tab, setTab] = useState('deals');
  const [token, setToken] = useState('');
  const [kpis, setKpis] = useState({ total_revenue: 152265, total_profit: 8825 });
  const [deals, setDeals] = useState([]);
  const [calcTitle, setCalcTitle] = useState('Rolex Submariner Date');
  const [calcPrice, setCalcPrice] = useState('7500');
  const [calcResult, setCalcResult] = useState(null);

  useEffect(() => {
    bootstrap();
  }, []);

  async function bootstrap() {
    try {
      const loginRes = await fetch(`${API_BASE}/api/v3/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'changeme' }),
      });
      const loginData = await loginRes.json();
      setToken(loginData.token);

      const sumRes = await fetch(`${API_BASE}/api/v3/mobile/summary`, {
        headers: { Authorization: `Bearer ${loginData.token}` },
      });
      const sum = await sumRes.json();
      if (sum.kpis) setKpis(sum.kpis);
      if (sum.deals) setDeals(sum.deals);
    } catch (e) {
      // Offline demo fallback
      setDeals([
        { id: 'T1', title: 'Rolex Submariner 2022', category: 'Watches', price: 7200, estimated_value: 10500, profit_pct: 45.8, net_profit: 3300 },
        { id: 'T2', title: 'CAT 320 Excavator', category: 'Industrial', price: 38000, estimated_value: 52000, profit_pct: 36.8, net_profit: 14000 },
      ]);
    }
  }

  async function runCalculator() {
    const ask = parseFloat(calcPrice || '1000');
    const fair = Math.round(ask * 1.38);
    const targetBuy = Math.round(ask * 0.85);
    const netProfit = Math.round(fair - targetBuy - fair * 0.06);
    setCalcResult({
      fair,
      targetBuy,
      netProfit,
      msg: `السلام عليكم، بخصوص (${calcTitle})، أنا مشتري جاد وجاهز للدفع الفوري اليوم بسعر $${targetBuy.toLocaleString()}.`,
    });
  }

  function openWhatsApp(deal) {
    const msg = encodeURIComponent(
      `مرحباً 🌟 فرصة استثمارية عبر Solomon AI:\n*${deal.title}*\nالسعر الخاص: $${deal.price.toLocaleString()} (التقييم السوقي: $${deal.estimated_value.toLocaleString()})`
    );
    Linking.openURL(`https://wa.me/?text=${msg}`);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.logo}>👑 Solomon AI Mobile</Text>
        <Text style={styles.badge}>iOS & Android</Text>
      </View>

      <ScrollView style={styles.body}>
        {tab === 'deals' && (
          <View>
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>إجمالي الإيرادات</Text>
                <Text style={styles.kpiVal}>${Math.round(kpis.total_revenue).toLocaleString()}</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>صافي الأرباح</Text>
                <Text style={[styles.kpiVal, { color: '#34d399' }]}>${Math.round(kpis.total_profit).toLocaleString()}</Text>
              </View>
            </View>

            {deals.map((d) => (
              <View key={d.id} style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.dealTitle}>{d.title}</Text>
                  <Text style={styles.roiBadge}>+{d.profit_pct}%</Text>
                </View>
                <Text style={styles.subText}>
                  الشراء: ${d.price.toLocaleString()} | التقييم: ${d.estimated_value.toLocaleString()} | الربح: +${d.net_profit.toLocaleString()}
                </Text>
                <TouchableOpacity style={styles.waBtn} onPress={() => openWhatsApp(d)}>
                  <Text style={styles.btnText}>📲 إرسال الصفقة عبر واتساب</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {tab === 'calc' && (
          <View style={styles.card}>
            <Text style={styles.dealTitle}>🧮 حاسبة الصفقات والتفاوض الذكية</Text>
            <TextInput style={styles.input} value={calcTitle} onChangeText={setCalcTitle} placeholder="اسم الأصل" placeholderTextColor="#64748b" />
            <TextInput style={styles.input} value={calcPrice} onChangeText={setCalcPrice} keyboardType="numeric" placeholder="السعر المعروض ($)" placeholderTextColor="#64748b" />
            <TouchableOpacity style={styles.goldBtn} onPress={runCalculator}>
              <Text style={[styles.btnText, { color: '#0f172a' }]}>⚡ احسب الربح ورسالة التفاوض</Text>
            </TouchableOpacity>
            {calcResult && (
              <View style={styles.resultBox}>
                <Text style={styles.subText}>السعر العادل: ${calcResult.fair.toLocaleString()}</Text>
                <Text style={styles.subText}>سعر الشراء بعد التفاوض: ${calcResult.targetBuy.toLocaleString()}</Text>
                <Text style={[styles.subText, { color: '#34d399', fontWeight: 'bold' }]}>صافي ربحك: +${calcResult.netProfit.toLocaleString()}</Text>
                <Text style={[styles.subText, { marginTop: 8 }]}>{calcResult.msg}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.tabBar}>
        <TouchableOpacity onPress={() => setTab('deals')}>
          <Text style={[styles.tabText, tab === 'deals' && styles.tabActive]}>🔥 الصفقات</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('calc')}>
          <Text style={[styles.tabText, tab === 'calc' && styles.tabActive]}>🧮 حاسبة الربح</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logo: { color: '#fbbf24', fontSize: 18, fontWeight: 'bold' },
  badge: { color: '#34d399', fontSize: 12, fontWeight: 'bold' },
  body: { flex: 1, padding: 16 },
  kpiRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  kpiCard: { width: '48%', backgroundColor: '#1e293b', padding: 14, borderRadius: 14 },
  kpiLabel: { color: '#94a3b8', fontSize: 12 },
  kpiVal: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  card: { backgroundColor: '#1e293b', padding: 16, borderRadius: 16, marginBottom: 14 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dealTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  roiBadge: { color: '#34d399', fontWeight: 'bold', fontSize: 14 },
  subText: { color: '#cbd5e1', fontSize: 13, marginVertical: 4 },
  waBtn: { backgroundColor: '#10b981', padding: 10, borderRadius: 10, marginTop: 10, alignItems: 'center' },
  goldBtn: { backgroundColor: '#f59e0b', padding: 12, borderRadius: 10, marginTop: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  input: { backgroundColor: '#0b1120', color: '#fff', padding: 12, borderRadius: 10, marginTop: 8, borderWidth: 1, borderColor: '#334155' },
  resultBox: { marginTop: 12, padding: 12, backgroundColor: '#0b1120', borderRadius: 10 },
  tabBar: { flexDirection: 'row', justifyContent: 'space-around', padding: 14, borderTopWidth: 1, borderTopColor: '#1e293b', backgroundColor: '#111827' },
  tabText: { color: '#64748b', fontWeight: 'bold', fontSize: 14 },
  tabActive: { color: '#fbbf24' },
});
