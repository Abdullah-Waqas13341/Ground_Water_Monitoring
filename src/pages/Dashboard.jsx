/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import {
  ChevronDown, Bell, Settings, User, Map, TrendingDown, TrendingUp,
  Droplet, AlertTriangle, Activity, Zap, Wind, Cloud, Gauge, Wrench,
  BarChart3, PieChart, Download, Calendar, RotateCcw, Navigation2,
  CheckCircle, AlertCircle, PlusCircle, MinusCircle, Target,
  LayoutDashboard, Radio, LineChart, BookOpen, FileText
} from 'lucide-react';
import Reports from './Reports';

export default function SmartGroundwaterDashboard() {
  const navigate = useNavigate();

  // ── User & Sensor State ──────────────────────────────────────────────────
  const [userData, setUserData] = useState(null);
  const [sensors, setSensors] = useState([]);
  const [selectedSensorId, setSelectedSensorId] = useState(null); // stores ID string only
  const [loading, setLoading] = useState(true);

  // ── Simulated real-time fallback values ───────────────────────────────────
  const [time, setTime] = useState(new Date());
  const [declineRate] = useState(0.12);
  const [rechargeRate] = useState(2.35);
  const [rainfallIntensity, setRainfallIntensity] = useState(15.4);
  const [pumpStatus] = useState('running');
  const [waterQuality] = useState(85);
  const [activeAlerts] = useState(3);
  const [calcResults, setCalcResults] = useState(null);

  // ── UI State ──────────────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTab, setCurrentTab] = useState('dashboard');

  // ── Derived active sensor (safe) ─────────────────────────────────────────
  const activeSensor = sensors.find(s => s.id === selectedSensorId) || null;

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      alert(error.message);
    }
  };

  // ── Clock tick ────────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
      setRainfallIntensity(Math.random() * 45);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // ── Load user profile ────────────────────────────────────────────────────
  useEffect(() => {
    const loadUser = async () => {
      if (!auth.currentUser) return;
      try {
        const docRef = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setUserData(docSnap.data());
      } catch (err) {
        console.error("Failed to load user:", err);
      }
    };
    loadUser();
  }, []);

  // ── Load sensors belonging to this user ──────────────────────────────────
  useEffect(() => {
    const loadSensors = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }
      try {
        const q = query(
          collection(db, "sensors"),
          where("ownerUid", "==", auth.currentUser.uid)
        );
        const snapshot = await getDocs(q);
        const sensorList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setSensors(sensorList);
        if (sensorList.length > 0) {
          setSelectedSensorId(sensorList[0].id); // store ID string only
        }
      } catch (err) {
        console.error("Failed to load sensors:", err);
      } finally {
        setLoading(false);
      }
    };
    loadSensors();
  }, []);

  // ── Design calculator handler ─────────────────────────────────────────────
  const handleCalculate = (e) => {
    e.preventDefault();
    const areaSize    = parseFloat(e.target.areaSize.value);
    const soilType    = e.target.soilType.value;
    const rainfall    = parseFloat(e.target.rainfall.value);
    const gwDepth     = parseFloat(e.target.gwDepth.value);
    const runoffCoeff = parseFloat(e.target.runoffCoeff.value);

    const soilInfiltration = { sand: 50, loam: 25, clay: 5 }[soilType] || 25;
    const tankVolume  = (areaSize * rainfall * runoffCoeff) / 1000;
    const wellDiameter = Math.sqrt((tankVolume / Math.PI) / 10);
    const wellDepth   = gwDepth * 0.8;
    const numWells    = Math.ceil(tankVolume / (soilInfiltration * wellDepth));

    setCalcResults({
      tankDimensions: {
        length: Math.sqrt(tankVolume) * 2,
        width:  Math.sqrt(tankVolume),
        depth:  2
      },
      wellDiameter:   wellDiameter.toFixed(2),
      wellDepth:      wellDepth.toFixed(2),
      storageVolume:  tankVolume.toFixed(2),
      numWells,
      annualRecharge: (tankVolume * 10).toFixed(0)
    });
  };

  // ── Navigation items ──────────────────────────────────────────────────────
  const navigationItems = [
    { id: 'dashboard',   label: 'Dashboard',             icon: LayoutDashboard },
    { id: 'monitoring',  label: 'Live Monitoring',        icon: Radio },
    { id: 'analytics',   label: 'Groundwater Analytics',  icon: LineChart },
    { id: 'recharge',    label: 'Recharge System',        icon: Droplet },
    { id: 'rainfall',    label: 'Rainfall Monitoring',    icon: Cloud },
    { id: 'calculator',  label: 'Design Calculator',      icon: Wrench },
    { id: 'mapping',     label: 'GIS Mapping',            icon: Map },
    { id: 'historical',  label: 'Historical Data',        icon: BookOpen },
    { id: 'alerts',      label: 'Alerts & AI',            icon: AlertTriangle },
    { id: 'reports',     label: 'Reports',                icon: FileText },
    { id: 'settings',    label: 'Settings',               icon: Settings },
  ];

  // ══════════════════════════════════════════════════════════════════════════
  // SUB-COMPONENTS
  // ══════════════════════════════════════════════════════════════════════════

  const MetricCard = ({ title, value, unit, icon: Icon, trend, trendValue, color, status }) => (
    <div className="group relative overflow-hidden rounded-2xl backdrop-blur-md border border-cyan-500/20 p-6 bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50 hover:border-cyan-400/50 transition-all duration-300 shadow-lg hover:shadow-cyan-500/20">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/5 via-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-slate-400 text-sm font-light tracking-wide">{title}</p>
            <div className="flex items-baseline gap-2 mt-3">
              <span className={`text-4xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                {isNaN(parseFloat(value)) ? value : parseFloat(value).toFixed(2)}
              </span>
              <span className="text-slate-500 text-sm">{unit}</span>
            </div>
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${color} text-white opacity-70 group-hover:opacity-100 transition-opacity`}>
            <Icon size={24} />
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-700/50">
            {trend === 'up'
              ? <TrendingUp  size={16} className="text-red-400" />
              : <TrendingDown size={16} className="text-green-400" />}
            <span className={`text-sm font-medium ${trend === 'up' ? 'text-red-400' : 'text-green-400'}`}>
              {trendValue} {trend === 'up' ? 'increase' : 'decrease'} today
            </span>
          </div>
        )}
        {status && (
          <div className={`mt-3 inline-block px-3 py-1 rounded-full text-xs font-semibold ${
            status === 'normal'  ? 'bg-green-500/20 text-green-300' :
            status === 'warning' ? 'bg-yellow-500/20 text-yellow-300' :
                                   'bg-red-500/20 text-red-300'
          }`}>
            {status === 'normal' ? '✓ Normal' : status === 'warning' ? '⚠ Warning' : '✗ Critical'}
          </div>
        )}
      </div>
    </div>
  );

  const GaugeChart = ({ label, value, max = 100, color }) => {
    // Firestore may return strings — force to number, fallback to 0
    const num = parseFloat(value) || 0;
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="relative w-32 h-32 rounded-full border-8 border-slate-700 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
          <div className="absolute inset-0 rounded-full" style={{
            background: `conic-gradient(from 0deg, ${
              color === 'cyan' ? '#06b6d4' : color === 'blue' ? '#3b82f6' : '#10b981'
            } 0deg ${(num / max) * 360}deg, transparent ${(num / max) * 360}deg)`,
            opacity: 0.5
          }} />
          <div className="relative z-10 text-center">
            <p className="text-3xl font-bold text-white">{num.toFixed(1)}</p>
            <p className="text-xs text-slate-400 mt-1">%</p>
          </div>
        </div>
        <p className="text-sm text-slate-400 mt-4 text-center font-medium">{label}</p>
      </div>
    );
  };

  const ChartSimulation = ({ title, data }) => (
    <div className="bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50 rounded-2xl border border-cyan-500/20 p-6 backdrop-blur-md">
      <h3 className="text-white font-semibold mb-6 text-lg">{title}</h3>
      <div className="relative h-48">
        <div className="absolute inset-0 flex items-end gap-1">
          {data.map((val, idx) => (
            <div key={idx} className="flex-1 flex flex-col justify-end group">
              <div
                className="w-full rounded-t-sm bg-gradient-to-t from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 transition-all duration-300 opacity-70 hover:opacity-100 relative"
                style={{ height: `${(val / 100) * 100}%` }}
              >
                <div className="absolute -top-8 left-0 right-0 text-center text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {val.toFixed(1)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8 flex justify-between text-xs text-slate-500">
        <span>0h</span><span>12h</span><span>24h</span>
      </div>
    </div>
  );

  const RechargeFlowDiagram = () => (
    <div className="bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50 rounded-2xl border border-cyan-500/20 p-8 backdrop-blur-md">
      <h3 className="text-white font-semibold mb-8 text-lg">Recharge System Flow</h3>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center gap-3">
            <Cloud className="text-blue-400" size={28} />
            <div>
              <p className="text-white font-semibold">Rainfall Collection</p>
              <p className="text-slate-400 text-sm">{rainfallIntensity.toFixed(1)} mm/h</p>
            </div>
          </div>
          <div className="text-cyan-400 text-2xl animate-pulse">↓</div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center gap-3">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded border-2 border-cyan-400">
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-400/30 to-transparent transition-all"
                  style={{ height: `${parseFloat(activeSensor?.tankLevel) || 0}%` }}
                />
              </div>
            </div>
            <div>
              <p className="text-white font-semibold">Storage Tank</p>
              <p className="text-slate-400 text-sm">{(parseFloat(activeSensor?.tankLevel) || 0).toFixed(1)}% Capacity</p>
            </div>
          </div>
          <div className="text-cyan-400 text-2xl animate-pulse">↓</div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center gap-3">
            <Zap className={pumpStatus === 'running' ? 'text-green-400 animate-pulse' : 'text-slate-500'} size={28} />
            <div>
              <p className="text-white font-semibold">Pump Status</p>
              <p className={`text-sm ${pumpStatus === 'running' ? 'text-green-400' : 'text-slate-400'}`}>
                {pumpStatus === 'running' ? '● RUNNING' : '● STANDBY'} • {(parseFloat(activeSensor?.flowRate) || 0).toFixed(1)} L/min
              </p>
            </div>
          </div>
          <div className="text-cyan-400 text-2xl animate-pulse">↓</div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center gap-3">
            <Droplet className="text-cyan-400 animate-pulse" size={28} />
            <div>
              <p className="text-white font-semibold">Recharge Well</p>
              <p className="text-slate-400 text-sm">Active Infiltration • {rechargeRate.toFixed(2)} m³/h</p>
            </div>
          </div>
          <div className="text-cyan-400 text-2xl animate-pulse">↓</div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center gap-3">
            <Activity className="text-emerald-400" size={28} />
            <div>
              <p className="text-white font-semibold">Groundwater Aquifer</p>
              <p className="text-slate-400 text-sm">
                Level: {(parseFloat(activeSensor?.waterLevel) || 0).toFixed(1)} m • Status: Improving
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const GISMap = () => (
    <div className="bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50 rounded-2xl border border-cyan-500/20 p-6 backdrop-blur-md h-96">
      <h3 className="text-white font-semibold mb-4 text-lg">GIS Mapping – Rawalpindi Region</h3>
      <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700/50 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'linear-gradient(0deg,transparent 24%,rgba(6,182,212,.05) 25%,rgba(6,182,212,.05) 26%,transparent 27%,transparent 74%,rgba(6,182,212,.05) 75%,rgba(6,182,212,.05) 76%,transparent 77%),linear-gradient(90deg,transparent 24%,rgba(6,182,212,.05) 25%,rgba(6,182,212,.05) 26%,transparent 27%,transparent 74%,rgba(6,182,212,.05) 75%,rgba(6,182,212,.05) 76%,transparent 77%)',
          backgroundSize: '50px 50px'
        }} />
        <div className="absolute inset-0 p-8">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-red-500/10 border border-red-500/30 animate-pulse" />
          <div className="absolute top-1/3 right-1/4 w-24 h-24 rounded-full bg-yellow-500/10 border border-yellow-500/30" />
          <div className="absolute bottom-1/4 left-1/3 w-40 h-40 rounded-full bg-green-500/10 border border-green-500/30" />
          {[{ x: '20%', y: '30%', label: 'Site A' }, { x: '60%', y: '50%', label: 'Site B' }, { x: '40%', y: '70%', label: 'Site C' }]
            .map((site, idx) => (
              <div key={idx} className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group" style={{ left: site.x, top: site.y }}>
                <div className="w-4 h-4 bg-cyan-400 rounded-full border-2 border-cyan-300 shadow-lg shadow-cyan-400/50 animate-pulse" />
                <div className="absolute top-6 left-0 text-xs text-cyan-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">{site.label}</div>
              </div>
            ))}
        </div>
        <div className="absolute bottom-4 right-4 space-y-2 text-xs bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-lg p-3">
          {[['red','High Stress'],['yellow','Medium Stress'],['green','Suitable Zone']].map(([c,l]) => (
            <div key={l} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full bg-${c}-500/50 border border-${c}-500`} />
              <span className="text-slate-300">{l}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full border border-cyan-300" />
            <span className="text-slate-300">Recharge Site</span>
          </div>
        </div>
      </div>
    </div>
  );

  const DesignCalculator = () => (
    <div className="bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50 rounded-2xl border border-cyan-500/20 p-8 backdrop-blur-md">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-white font-semibold text-lg mb-6">Engineering Calculator</h3>
          <form onSubmit={handleCalculate} className="space-y-6">
            {[
              { id: 'areaSize',    label: 'Catchment Area (km²)',   type: 'number', step: '0.1',  def: '5'    },
              { id: 'rainfall',    label: 'Annual Rainfall (mm)',    type: 'number', step: '10',   def: '400'  },
              { id: 'gwDepth',     label: 'Groundwater Depth (m)',   type: 'number', step: '1',    def: '45'   },
              { id: 'runoffCoeff', label: 'Runoff Coefficient',      type: 'number', step: '0.05', def: '0.35', min:'0', max:'1' },
            ].map(f => (
              <div key={f.id}>
                <label className="block text-slate-300 text-sm font-medium mb-2">{f.label}</label>
                <input
                  name={f.id}
                  type={f.type}
                  step={f.step}
                  min={f.min}
                  max={f.max}
                  defaultValue={f.def}
                  className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none transition-all"
                />
              </div>
            ))}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Soil Type</label>
              <select name="soilType" className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none transition-all">
                <option value="sand">Sand (K = 50 m/day)</option>
                <option value="loam">Loam (K = 25 m/day)</option>
                <option value="clay">Clay (K = 5 m/day)</option>
              </select>
            </div>
            <button type="submit" className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg hover:shadow-cyan-500/50 flex items-center justify-center gap-2">
              <Target size={18} /> Calculate Design Parameters
            </button>
          </form>
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg mb-6">Design Recommendations</h3>
          {calcResults ? (
            <div className="space-y-4">
              {[
                { label: 'Tank Dimensions',              value: `L: ${calcResults.tankDimensions.length.toFixed(1)}m × W: ${calcResults.tankDimensions.width.toFixed(1)}m × D: ${calcResults.tankDimensions.depth.toFixed(1)}m`, color: 'text-cyan-400' },
                { label: 'Recharge Well Diameter',       value: `${calcResults.wellDiameter} m`,            color: 'text-blue-400'   },
                { label: 'Recharge Well Depth',          value: `${calcResults.wellDepth} m`,               color: 'text-emerald-400' },
                { label: 'Storage Volume',               value: `${calcResults.storageVolume} m³`,          color: 'text-purple-400' },
                { label: 'Number of Recharge Wells',     value: `${calcResults.numWells} wells`,            color: 'text-orange-400' },
                { label: 'Annual Recharge Potential',    value: `${calcResults.annualRecharge} m³/year`,    color: 'text-green-400'  },
              ].map(r => (
                <div key={r.label} className="bg-slate-800/30 border border-cyan-500/20 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">{r.label}</p>
                  <p className={`${r.color} font-semibold`}>{r.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-500">
              <p>Fill in parameters and calculate to see recommendations</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const AlertPanel = () => (
    <div className="space-y-3">
      {[
        { type: 'warning', msg: 'Water table declining at 0.12 m/day',              priority: 'high'   },
        { type: 'info',    msg: 'Rainfall event expected in 12 hours',               priority: 'medium' },
        { type: 'success', msg: 'Recharge system operating at 94% efficiency',       priority: 'low'    },
      ].map((alert, idx) => (
        <div key={idx} className={`flex items-start gap-4 p-4 rounded-lg border backdrop-blur-md ${
          alert.type === 'warning' ? 'bg-red-500/10 border-red-500/30' :
          alert.type === 'info'    ? 'bg-blue-500/10 border-blue-500/30' :
                                     'bg-green-500/10 border-green-500/30'
        }`}>
          {alert.type === 'warning' ? <AlertCircle className="text-red-400 flex-shrink-0 mt-1"  size={20} /> :
           alert.type === 'info'    ? <Bell         className="text-blue-400 flex-shrink-0 mt-1" size={20} /> :
                                      <CheckCircle  className="text-green-400 flex-shrink-0 mt-1" size={20} />}
          <div className="flex-1">
            <p className="text-white text-sm font-medium">{alert.msg}</p>
            <p className={`text-xs mt-1 ${
              alert.priority === 'high'   ? 'text-red-400' :
              alert.priority === 'medium' ? 'text-yellow-400' : 'text-green-400'
            }`}>Priority: {alert.priority.toUpperCase()}</p>
          </div>
        </div>
      ))}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // LOADING / EMPTY STATES
  // ══════════════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-lg">Connecting to Firestore…</p>
        </div>
      </div>
    );
  }

  if (sensors.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <Droplet className="mx-auto text-cyan-400" size={48} />
          <p className="text-cyan-400 text-xl font-semibold">No Sensors Found</p>
          <p className="text-slate-400 text-sm">
            No sensors are registered to your account. Please add a sensor in Settings or contact your administrator.
          </p>
          <button
            onClick={handleLogout}
            className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Animated background blobs */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 flex h-screen overflow-hidden">

        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <div className={`${sidebarOpen ? 'w-72' : 'w-20'} bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900/80 backdrop-blur-md border-r border-cyan-500/10 overflow-y-auto transition-all duration-300 flex flex-col`}>
          {/* Logo */}
          <div className="p-6 border-b border-cyan-500/10 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex-shrink-0">
              <Droplet size={24} />
            </div>
            {sidebarOpen && (
              <div>
                <p className="font-bold text-sm text-white">SMART RECHARGE</p>
                <p className="text-xs text-cyan-400">v2.1</p>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                    currentTab === item.id
                      ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/20 border border-cyan-400/50 text-cyan-300 shadow-lg shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="p-4 border-t border-cyan-500/10">
            <button className="w-full flex items-center justify-center py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-all">
              {sidebarOpen
                ? <span className="text-sm text-slate-400 flex items-center gap-2"><Settings size={16} /> Settings</span>
                : <Settings size={18} className="text-slate-400" />}
            </button>
          </div>
        </div>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Top Header */}
          <div className="bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/80 backdrop-blur-md border-b border-cyan-500/10 px-8 py-4 flex items-center justify-between">

            {/* Left: toggle + title */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-slate-800/50 transition-all"
              >
                <ChevronDown size={24} className={`transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
              </button>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Smart Groundwater Recharge &amp; Monitoring
                </h1>
                <p className="text-xs text-slate-400">Final Year Civil Engineering Project</p>
                {userData && (
                  <p className="text-xs text-cyan-300 mt-0.5">Welcome, {userData.name}</p>
                )}
              </div>
            </div>

            {/* Right: sensor dropdown + clock + status + logout */}
            <div className="flex items-center gap-4">

              {/* Sensor selector */}
              <select
                value={selectedSensorId || ""}
                onChange={e => setSelectedSensorId(e.target.value)}
                className="bg-slate-800 text-white px-3 py-2 rounded-lg border border-cyan-500/50 focus:border-cyan-400 focus:outline-none text-sm"
              >
                {sensors.map(sensor => (
                  <option key={sensor.id} value={sensor.id}>
                    {sensor.sensorId || sensor.id}
                  </option>
                ))}
              </select>

              {/* Clock */}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-white">{time.toLocaleTimeString()}</p>
                <p className="text-xs text-slate-400">{time.toLocaleDateString()}</p>
              </div>

              {/* System active badge */}
              <div className="px-3 py-1 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-green-400">ACTIVE</span>
              </div>

              {/* Bell */}
              <button className="relative p-2 rounded-lg hover:bg-slate-800/50 transition-all">
                <Bell size={20} className="text-slate-400" />
                {activeAlerts > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm font-medium transition-all"
              >
                Logout
              </button>
            </div>
          </div>

          {/* ── Page content ──────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-8">

              {/* ── DASHBOARD ── */}
              {currentTab === 'dashboard' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-6">System Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <MetricCard
                        title="Groundwater Level"
                        value={parseFloat(activeSensor?.waterLevel) || 0}
                        unit="m"
                        icon={Droplet}
                        trend="down"
                        trendValue="0.12m"
                        color="from-cyan-500 to-blue-500"
                        status="warning"
                      />
                      <MetricCard
                        title="Decline Rate"
                        value={declineRate}
                        unit="m/day"
                        icon={TrendingDown}
                        color="from-red-500 to-orange-500"
                        status="warning"
                      />
                      <MetricCard
                        title="Recharge Rate"
                        value={rechargeRate}
                        unit="m³/h"
                        icon={TrendingUp}
                        color="from-green-500 to-emerald-500"
                        status="normal"
                      />
                      <MetricCard
                        title="Rainfall"
                        value={rainfallIntensity}
                        unit="mm/h"
                        icon={Cloud}
                        color="from-blue-500 to-cyan-500"
                      />
                      <MetricCard
                        title="Pump Status"
                        value={pumpStatus === 'running' ? '✓' : '●'}
                        unit="Active"
                        icon={Zap}
                        color="from-green-500 to-emerald-500"
                        status={pumpStatus === 'running' ? 'normal' : 'warning'}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartSimulation title="Water Table Trend (24h)"  data={[42,43,44,44.5,45,45.5,45.8,46,46.2,45.9,45.7,45.5,45.3]} />
                    <ChartSimulation title="Recharge Volume (24h)"    data={[20,35,45,65,72,68,62,55,48,42,35,28,22]} />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-white mb-6">System Performance Metrics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {[
                        { label: 'Tank Capacity',    value: parseFloat(activeSensor?.tankLevel)  || 0, color: 'cyan'    },
                        { label: 'Water Quality',    value: waterQuality,                  color: 'blue'    },
                        { label: 'System Efficiency',value: 90,                            color: 'emerald' },
                      ].map(g => (
                        <div key={g.label} className="bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50 rounded-2xl border border-cyan-500/20 p-8 backdrop-blur-md flex flex-col items-center justify-center">
                          <GaugeChart label={g.label} value={g.value} color={g.color} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <RechargeFlowDiagram />

                  <div>
                    <h2 className="text-xl font-bold text-white mb-6">Active Alerts &amp; Notifications</h2>
                    <AlertPanel />
                  </div>
                </div>
              )}

              {/* ── LIVE MONITORING ── */}
              {currentTab === 'monitoring' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-white">Live Monitoring System</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartSimulation title="Water Level (Real-time)"   data={[45,45.2,45.4,45.3,45.5,45.7,45.9,46,46.1,45.9,45.7,45.5,45.3]} />
                    <ChartSimulation title="System Flow Rate (L/min)"  data={[40,42,45,48,50,48,45,42,40,38,35,32,30]} />
                  </div>
                  <RechargeFlowDiagram />

                  {/* Live sensor data table */}
                  <div className="bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50 rounded-2xl border border-cyan-500/20 p-6 backdrop-blur-md">
                    <h3 className="text-white font-semibold mb-4 text-lg">Current Sensor Readings</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Water Level',  value: `${(parseFloat(activeSensor?.waterLevel) || 0).toFixed(2)} m`,     color: 'text-cyan-400'    },
                        { label: 'Tank Level',   value: `${(parseFloat(activeSensor?.tankLevel)  || 0).toFixed(1)} %`,     color: 'text-blue-400'    },
                        { label: 'Flow Rate',    value: `${(parseFloat(activeSensor?.flowRate)   || 0).toFixed(1)} L/min`, color: 'text-emerald-400' },
                        { label: 'Sensor ID',    value: activeSensor?.id ?? '—',                               color: 'text-slate-300'   },
                      ].map(r => (
                        <div key={r.label} className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
                          <p className="text-slate-400 text-xs mb-1">{r.label}</p>
                          <p className={`${r.color} font-bold text-lg`}>{r.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── ANALYTICS ── */}
              {currentTab === 'analytics' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-white">Groundwater Analytics</h2>
                  <ChartSimulation title="Monthly Groundwater Level Trend" data={[50,49.8,49.5,49.2,48.9,48.5,48.2,47.8,47.5,47.2,46.8,46.5,46.2]} />
                  <ChartSimulation title="Seasonal Water Balance"          data={[30,35,40,45,50,55,60,58,52,45,38,32,28]} />
                </div>
              )}

              {/* ── RECHARGE ── */}
              {currentTab === 'recharge' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-white">Recharge System Control</h2>
                  <RechargeFlowDiagram />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50 rounded-2xl border border-cyan-500/20 p-6 backdrop-blur-md">
                      <h3 className="text-white font-semibold mb-4">Control Panel</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
                          <span className="text-slate-300">Pump Control</span>
                          <button className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            pumpStatus === 'running'
                              ? 'bg-red-500/30 text-red-300 hover:bg-red-500/50'
                              : 'bg-green-500/30 text-green-300 hover:bg-green-500/50'
                          }`}>
                            {pumpStatus === 'running' ? 'STOP' : 'START'}
                          </button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
                          <span className="text-slate-300">Mode</span>
                          <div className="space-x-2">
                            <button className="px-3 py-1 rounded text-xs bg-cyan-500/30 text-cyan-300 hover:bg-cyan-500/50">AUTO</button>
                            <button className="px-3 py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600">MANUAL</button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50 rounded-2xl border border-cyan-500/20 p-6 backdrop-blur-md">
                      <h3 className="text-white font-semibold mb-4">System Status</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Flow Rate</span>
                          <span className="text-cyan-400 font-semibold">{(parseFloat(activeSensor?.flowRate) || 0).toFixed(1)} L/min</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Recharge Efficiency</span>
                          <span className="text-green-400 font-semibold">94.2%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Daily Volume</span>
                          <span className="text-blue-400 font-semibold">156.8 m³</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── RAINFALL ── */}
              {currentTab === 'rainfall' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-white">Rainfall Monitoring</h2>
                  <ChartSimulation title="Rainfall Intensity (mm/h)" data={[2,5,8,12,15,18,20,18,15,12,8,5,2]} />
                </div>
              )}

              {/* ── CALCULATOR ── */}
              {currentTab === 'calculator' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-white">Smart Design Calculator</h2>
                  <DesignCalculator />
                </div>
              )}

              {/* ── GIS MAPPING ── */}
              {currentTab === 'mapping' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-white">GIS &amp; Spatial Analysis</h2>
                  <GISMap />
                </div>
              )}

              {/* ── HISTORICAL ── */}
              {currentTab === 'historical' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-white">Historical Data</h2>
                  <div className="bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50 rounded-2xl border border-cyan-500/20 p-6 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-white font-semibold">Data Records</h3>
                      <button className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 flex items-center gap-2 text-sm font-medium transition-all">
                        <Calendar size={16} /> Select Date Range
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700/50">
                            {['Date','GW Level (m)','Recharge (m³)','Rainfall (mm)','Tank Level (%)'].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-slate-400 font-semibold">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[...Array(8)].map((_, i) => (
                            <tr key={i} className="border-b border-slate-700/30 hover:bg-slate-800/20 transition-all">
                              <td className="px-4 py-3 text-slate-300">{new Date(Date.now() - i * 86400000).toLocaleDateString()}</td>
                              <td className="px-4 py-3 text-cyan-400 font-medium">{(45 + i * 0.1).toFixed(2)}</td>
                              <td className="px-4 py-3 text-blue-400 font-medium">{(150 + Math.random() * 50).toFixed(1)}</td>
                              <td className="px-4 py-3 text-emerald-400 font-medium">{(Math.random() * 30).toFixed(1)}</td>
                              <td className="px-4 py-3 text-orange-400 font-medium">{(70 + Math.random() * 15).toFixed(1)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ── ALERTS & AI ── */}
              {currentTab === 'alerts' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-white">Smart Alerts &amp; AI Recommendations</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <h3 className="text-white font-semibold mb-4 text-lg">Active Alerts</h3>
                      <AlertPanel />
                    </div>
                    <div className="bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50 rounded-2xl border border-cyan-500/20 p-6 backdrop-blur-md">
                      <h3 className="text-white font-semibold mb-4">AI Recommendations</h3>
                      <div className="space-y-3 text-sm">
                        <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                          <p className="text-cyan-300 font-medium">✓ Activate secondary recharge well at 16:00</p>
                        </div>
                        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                          <p className="text-blue-300 font-medium">✓ Schedule maintenance in 7 days</p>
                        </div>
                        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                          <p className="text-green-300 font-medium">✓ Water quality optimal – safe to recharge</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── REPORTS ── */}
              {currentTab === 'reports' && <Reports />}

              {/* ── SETTINGS ── */}
              {currentTab === 'settings' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-white">Settings</h2>
                  <div className="bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-900/50 rounded-2xl border border-cyan-500/20 p-6 backdrop-blur-md">
                    <h3 className="text-white font-semibold mb-4">Account Information</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center p-4 bg-slate-800/30 rounded-lg">
                        <span className="text-slate-400">Name</span>
                        <span className="text-white font-medium">{userData?.name ?? '—'}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-slate-800/30 rounded-lg">
                        <span className="text-slate-400">Email</span>
                        <span className="text-white font-medium">{userData?.email ?? auth.currentUser?.email ?? '—'}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-slate-800/30 rounded-lg">
                        <span className="text-slate-400">Sensors Registered</span>
                        <span className="text-cyan-400 font-semibold">{sensors.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
