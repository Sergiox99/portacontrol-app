import { useState, useEffect } from 'react';

function App() {
  const [vistaActual, setVistaActual] = useState('diario');
  const [fecha, setFecha] = useState(new Date());

  const [config, setConfig] = useState(() => {
    const guardado = localStorage.getItem('portacontrol_ajustes');
    return guardado ? JSON.parse(guardado) : {
      cuotaCamion: 1200,
      seguro: 350,
      gestoria: 100,
      otrosFijos: 200,
      porcentajeIva: 21
    };
  });

  const [datosDiarios, setDatosDiarios] = useState(() => {
    const guardado = localStorage.getItem('portacontrol_datos');
    return guardado ? JSON.parse(guardado) : {};
  });

  const [ingresoInput, setIngresoInput] = useState('');
  const [conceptoIngreso, setConceptoIngreso] = useState('');
  const [gastoInput, setGastoInput] = useState('');
  const [conceptoGasto, setConceptoGasto] = useState('');
  const [llevaIva, setLlevaIva] = useState(true);

  useEffect(() => {
    localStorage.setItem('portacontrol_datos', JSON.stringify(datosDiarios));
  }, [datosDiarios]);

  useEffect(() => {
    localStorage.setItem('portacontrol_ajustes', JSON.stringify(config));
  }, [config]);

  const year = fecha.getFullYear();
  const month = fecha.getMonth();
  const fechaKey = `${year}-${(month + 1).toString().padStart(2, '0')}-${fecha.getDate().toString().padStart(2, '0')}`;

  const datosDia = datosDiarios[fechaKey] || { ingresos: [], gastos: [], notas: '' };

  const agregarIngreso = () => {
    const monto = parseFloat(ingresoInput);
    if (monto > 0) {
      const aplicableIva = llevaIva;
      const nuevoIngreso = { 
        id: Date.now(), 
        concepto: conceptoIngreso || 'Viaje / Portacoches', 
        monto, 
        iva: aplicableIva ? monto * (config.porcentajeIva / 100) : 0 
      };
      const nuevosIngresos = [...(datosDia.ingresos || []), nuevoIngreso];
      setDatosDiarios(prev => ({ ...prev, [fechaKey]: { ...datosDia, ingresos: nuevosIngresos } }));
      setIngresoInput('');
      setConceptoIngreso('');
    }
  };

  const eliminarIngreso = (id) => {
    const nuevosIngresos = datosDia.ingresos.filter(i => i.id !== id);
    setDatosDiarios(prev => ({ ...prev, [fechaKey]: { ...datosDia, ingresos: nuevosIngresos } }));
  };

  const agregarGasto = () => {
    const monto = parseFloat(gastoInput);
    if (monto > 0) {
      const aplicableIva = llevaIva;
      const nuevoGasto = { 
        id: Date.now(), 
        concepto: conceptoGasto || 'Gasoil / Varios', 
        monto,
        iva: aplicableIva ? monto * (config.porcentajeIva / 100) : 0
      };
      const nuevosGastos = [...(datosDia.gastos || []), nuevoGasto];
      setDatosDiarios(prev => ({ ...prev, [fechaKey]: { ...datosDia, gastos: nuevosGastos } }));
      setGastoInput('');
      setConceptoGasto('');
    }
  };

  const eliminarGasto = (id) => {
    const nuevosGastos = datosDia.gastos.filter(g => g.id !== id);
    setDatosDiarios(prev => ({ ...prev, [fechaKey]: { ...datosDia, gastos: nuevosGastos } }));
  };

  const calcularTotalesMes = (m, y) => {
    let tIngresos = 0;
    let tIvaRepercutido = 0;
    let tGastosVariables = 0;
    let tIvaSoportado = 0;
    const prefijo = `${y}-${(m + 1).toString().padStart(2, '0')}`;

    Object.keys(datosDiarios).forEach(key => {
      if (key.startsWith(prefijo)) {
        const d = datosDiarios[key];
        (d.ingresos || []).forEach(i => {
          tIngresos += i.monto;
          tIvaRepercutido += (i.iva || 0);
        });
        (d.gastos || []).forEach(g => {
          tGastosVariables += g.monto;
          tIvaSoportado += (g.iva || 0);
        });
      }
    });

    const totalGastosFijos = Object.values(config).filter((_, idx) => idx < 4).reduce((a, b) => a + (parseFloat(b) || 0), 0);
    const tGastosTotales = tGastosVariables + totalGastosFijos;
    const beneficioNeto = tIngresos - tGastosTotales;
    const balanceIva = tIvaRepercutido - tIvaSoportado;

    return { tIngresos, tIvaRepercutido, tGastosVariables, tIvaSoportado, totalGastosFijos, tGastosTotales, beneficioNeto, balanceIva };
  };

  const mesActualTotales = calcularTotalesMes(month, year);

  const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', fontSize: '16px', border: '1px solid #333', backgroundColor: '#000', color: '#fff', boxSizing: 'border-box', marginBottom: '10px' };

  return (
    <div style={{ padding: '15px', backgroundColor: '#121212', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif', maxWidth: '480px', margin: '0 auto' }}>
      
      {/* Cabecera con el logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px', background: '#1a1a1a', padding: '14px 18px', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
        <img src="/logo.png" alt="Logo" style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }} />
        <div>
          <h1 style={{ fontSize: '17px', margin: 0, color: '#4CAF50', fontWeight: 'bold' }}>Portacontrol</h1>
          <p style={{ fontSize: '12px', margin: 0, color: '#aaa' }}>Gestión de Autónomo</p>
        </div>
      </div>

      {/* Menú de pestañas */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '18px' }}>
        {['diario', 'mensual', 'anual', 'calendario', 'ajustes'].map(v => (
          <button key={v} onClick={() => setVistaActual(v)} style={{ flex: 1, padding: '11px 2px', borderRadius: '8px', border: 'none', background: vistaActual === v ? '#4CAF50' : '#1e1e1e', color: vistaActual === v ? '#000' : 'white', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10px', cursor: 'pointer' }}>{v}</button>
        ))}
      </div>

      {/* VISTA DIARIO */}
      {vistaActual === 'diario' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', background: '#1a1a1a', padding: '14px 20px', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
            <button onClick={() => setFecha(new Date(year, month, fecha.getDate()-1))} style={{fontSize: '22px', background:'none', border:'none', color:'white', cursor: 'pointer', padding: '0 5px'}}>&lt;</button>
            <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#fff', textTransform: 'capitalize' }}>
              {fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' })}
            </span>
            <button onClick={() => setFecha(new Date(year, month, fecha.getDate()+1))} style={{fontSize: '22px', background:'none', border:'none', color:'white', cursor: 'pointer', padding: '0 5px'}}>&gt;</button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1a1a1a', padding: '12px 16px', borderRadius: '10px', marginBottom: '15px', border: '1px solid #2a2a2a', fontSize: '14px' }}>
            <span>Aplicar IVA ({config.porcentajeIva}%):</span>
            <input type="checkbox" checked={llevaIva} onChange={(e) => setLlevaIva(e.target.checked)} style={{ width: '22px', height: '22px', accentColor: '#4CAF50', cursor: 'pointer' }} />
          </div>

          <div style={{ background: '#1a1a1a', padding: '16px', borderRadius: '12px', marginBottom: '15px', border: '1px solid #2e7d32' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#4CAF50', fontSize: '16px' }}>Ingresos del Día</h3>
            <input type="text" placeholder="Concepto (ej: Portes Madrid)" value={conceptoIngreso} onChange={(e) => setConceptoIngreso(e.target.value)} style={inputStyle} />
            <input type="number" inputMode="decimal" placeholder="Importe (€)" value={ingresoInput} onChange={(e) => setIngresoInput(e.target.value)} style={inputStyle} />
            <button onClick={agregarIngreso} style={{ width: '100%', padding: '13px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>Añadir Ingreso</button>
            
            {datosDia.ingresos?.map(i => (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', background: '#111', padding: '11px', borderRadius: '6px' }}>
                <span style={{ fontSize: '14px' }}>{i.concepto}: <strong>{i.monto.toFixed(2)}€</strong> {i.iva > 0 && <span style={{color: '#aaa', fontSize: '12px'}}>(IVA: {i.iva.toFixed(2)}€)</span>}</span>
                <button onClick={() => eliminarIngreso(i.id)} style={{ background: '#ff4d4d', border: 'none', color: 'white', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
              </div>
            ))}
          </div>

          <div style={{ background: '#1a1a1a', padding: '16px', borderRadius: '12px', border: '1px solid #c62828' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#ff4d4d', fontSize: '16px' }}>Gastos Variables (Gasoil, Peajes...)</h3>
            <input type="text" placeholder="Concepto (ej: Gasoil Repsol)" value={conceptoGasto} onChange={(e) => setConceptoGasto(e.target.value)} style={inputStyle} />
            <input type="number" inputMode="decimal" placeholder="Importe (€)" value={gastoInput} onChange={(e) => setGastoInput(e.target.value)} style={inputStyle} />
            <button onClick={agregarGasto} style={{ width: '100%', padding: '13px', background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>Añadir Gasto</button>
            
            {datosDia.gastos?.map(g => (
              <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', background: '#111', padding: '11px', borderRadius: '6px' }}>
                <span style={{ fontSize: '14px' }}>{g.concepto}: <strong>{g.monto.toFixed(2)}€</strong> {g.iva > 0 && <span style={{color: '#aaa', fontSize: '12px'}}>(IVA: {g.iva.toFixed(2)}€)</span>}</span>
                <button onClick={() => eliminarGasto(g.id)} style={{ background: '#ff4d4d', border: 'none', color: 'white', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISTA RESUMEN MENSUAL */}
      {vistaActual === 'mensual' && (
        <div style={{ background: '#1a1a1a', padding: '22px', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px', textTransform: 'capitalize', fontSize: '19px', color: '#fff' }}>Resumen de {fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}><span>Total Facturado (Base):</span><strong style={{color: '#4CAF50'}}>{mesActualTotales.tIngresos.toFixed(2)}€</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '14px', color: '#aaa' }}><span>IVA Repercutido (Cobrado):</span><span>+{mesActualTotales.tIvaRepercutido.toFixed(2)}€</span></div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}><span>Gastos Variables:</span><span style={{color: '#ff4d4d'}}>{mesActualTotales.tGastosVariables.toFixed(2)}€</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}><span>Gastos Fijos:</span><span style={{color: '#ff4d4d'}}>{mesActualTotales.totalGastosFijos.toFixed(2)}€</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px', fontSize: '14px', color: '#aaa' }}><span>IVA Soportado (Pagado):</span><span>-{mesActualTotales.tIvaSoportado.toFixed(2)}€</span></div>

          <hr style={{ borderColor: '#333', margin: '18px 0' }}/>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '16px' }}>
            <span>Balance IVA (A ingresar):</span>
            <strong style={{color: '#2196F3'}}>{mesActualTotales.balanceIva.toFixed(2)}€</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', background: '#111', padding: '16px', borderRadius: '10px', border: '1px solid #333' }}>
            <span>Beneficio Neto:</span><span style={{ color: mesActualTotales.beneficioNeto >= 0 ? '#4CAF50' : '#ff4d4d' }}>{mesActualTotales.beneficioNeto.toFixed(2)}€</span>
          </div>
        </div>
      )}

      {/* VISTA RESUMEN ANUAL */}
      {vistaActual === 'anual' && (
        <div style={{ background: '#1a1a1a', padding: '18px', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '18px', fontSize: '19px', color: '#fff' }}>Resumen Anual ({year})</h2>
          {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((nombreMes, index) => {
            const t = calcularTotalesMes(index, year);
            return (
              <div key={nombreMes} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 6px', borderBottom: '1px solid #2a2a2a', fontSize: '14px' }}>
                <span style={{ width: '90px', fontWeight: 'bold', color: '#ddd' }}>{nombreMes}:</span>
                <span style={{ color: '#4CAF50' }}>Ing: {t.tIngresos.toFixed(0)}€</span>
                <span style={{ color: '#ff4d4d' }}>Gas: {t.tGastosTotales.toFixed(0)}€</span>
                <span style={{ fontWeight: 'bold', color: t.beneficioNeto >= 0 ? '#4CAF50' : '#ff4d4d', minWidth: '65px', textAlign: 'right' }}>{t.beneficioNeto.toFixed(0)}€</span>
              </div>
            );
          })}
        </div>
      )}

      {/* VISTA CALENDARIO CON TARJETAS VERTICALES Y TÍTULO EN BLANCO */}
      {vistaActual === 'calendario' && (
        <div style={{ background: '#1a1a1a', padding: '18px', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <button onClick={() => setFecha(new Date(year, month - 1, 1))} style={{ fontSize: '14px', background: '#222', border: '1px solid #333', color: '#fff', borderRadius: '8px', padding: '9px 14px', cursor: 'pointer', fontWeight: 'bold' }}>&lt; Mes</button>
            <h2 style={{ margin: 0, textTransform: 'capitalize', fontSize: '17px', color: '#ffffff', fontWeight: 'bold', letterSpacing: '0.5px' }}>{fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h2>
            <button onClick={() => setFecha(new Date(year, month + 1, 1))} style={{ fontSize: '14px', background: '#222', border: '1px solid #333', color: '#fff', borderRadius: '8px', padding: '9px 14px', cursor: 'pointer', fontWeight: 'bold' }}>Mes &gt;</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {['Lu','Ma','Mi','Ju','Vi','Sa','Do'].map(d => <div key={d} style={{ textAlign: 'center', color: '#4CAF50', fontSize: '13px', fontWeight: 'bold', paddingBottom: '8px' }}>{d}</div>)}
            {[...Array((new Date(year, month, 1).getDay() + 6) % 7)].map((_, i) => <div key={`empty-${i}`}></div>)}
            {[...Array(new Date(year, month + 1, 0).getDate())].map((_, i) => {
              const diaReal = i + 1;
              const esHoy = new Date().toDateString() === new Date(year, month, diaReal).toDateString();

              return (
                <button 
                  key={diaReal} 
                  onClick={() => { setFecha(new Date(year, month, diaReal)); setVistaActual('diario'); }} 
                  style={{ 
                    padding: '24px 2px', 
                    backgroundColor: esHoy ? '#10341c' : '#141c16', 
                    border: esHoy ? '2px solid #4CAF50' : '1px solid #1e3d25', 
                    borderRadius: '10px', 
                    color: 'white', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    cursor: 'pointer',
                    minHeight: '75px',
                    boxShadow: esHoy ? '0 0 12px rgba(76, 175, 80, 0.6)' : 'none'
                  }}>
                  <span style={{ fontWeight: '900', fontSize: esHoy ? '20px' : '17px', color: esHoy ? '#76ff03' : '#ffffff' }}>{diaReal}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* VISTA AJUSTES */}
      {vistaActual === 'ajustes' && (
        <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '8px', fontSize: '19px', color: '#fff' }}>Configuración General</h2>
          <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '20px', textAlign: 'center' }}>Gastos fijos mensuales y porcentaje de IVA aplicable.</p>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#4CAF50', fontSize: '14px' }}>Porcentaje de IVA (%)</label>
            <input type="number" inputMode="decimal" value={config.porcentajeIva} onChange={(e) => setConfig({ ...config, porcentajeIva: parseFloat(e.target.value) || 0 })} style={inputStyle} />
          </div>

          <hr style={{ borderColor: '#333', margin: '20px 0' }}/>

          {Object.entries(config).filter(([key]) => key !== 'porcentajeIva').map(([key, val]) => (
            <div key={key} style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', textTransform: 'capitalize', marginBottom: '6px', fontWeight: 'bold', color: '#ddd', fontSize: '14px' }}>{key.replace(/([A-Z])/g, ' $1')}</label>
              <input type="number" inputMode="decimal" value={val} onChange={(e) => setConfig({ ...config, [key]: parseFloat(e.target.value) || 0 })} style={inputStyle} />
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default App;