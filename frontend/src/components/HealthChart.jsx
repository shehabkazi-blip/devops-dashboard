import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell
} from 'recharts';

function formatTime(t) {
  return new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function HealthChart({ history }) {
  const latencyData = history.map((h) => ({
    time: formatTime(h.checkedAt),
    latency: h.latencyMs,
    status: h.status
  }));

  const uptimeData = history.map((h) => ({
    time: formatTime(h.checkedAt),
    value: h.status === 'up' ? 1 : 0,
    status: h.status
  }));

  return (
    <>
      <div className="chart-wrap">
        <div className="chart-title">Latency trend (ms)</div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={latencyData}>
            <defs>
              <linearGradient id="latencyFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5b8cff" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#5b8cff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#232937" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: '#5b6472', fontSize: 11 }} axisLine={{ stroke: '#232937' }} tickLine={false} />
            <YAxis tick={{ fill: '#5b6472', fontSize: 11 }} axisLine={{ stroke: '#232937' }} tickLine={false} width={44} />
            <Tooltip
              contentStyle={{ background: '#171c27', border: '1px solid #232937', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#8891a1' }}
            />
            <Area type="monotone" dataKey="latency" stroke="#5b8cff" fill="url(#latencyFill)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-wrap">
        <div className="chart-title">Uptime pulse (each bar = one check)</div>
        <ResponsiveContainer width="100%" height={90}>
          <BarChart data={uptimeData}>
            <XAxis dataKey="time" hide />
            <Tooltip
              contentStyle={{ background: '#171c27', border: '1px solid #232937', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#8891a1' }}
              formatter={(_, __, props) => [props.payload.status.toUpperCase(), 'status']}
            />
            <Bar dataKey="value" radius={[2, 2, 2, 2]}>
              {uptimeData.map((entry, i) => (
                <Cell key={i} fill={entry.status === 'up' ? '#3ddc84' : '#ff5c5c'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
