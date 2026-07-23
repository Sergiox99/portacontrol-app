import { useState, useEffect } from 'react';

function App() {
  const [vistaActual, setVistaActual] = useState('diario');
  const [fecha, setFecha] = useState(new Date());

  // Ajustes iniciales (Gastos fijos mensuales y porcentaje de IVA por defecto)
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
      
      {/* Cabecera con el logo (logo.png) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px', background: '#1a1a1a', padding: '12px 15px', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
        <img src="/logo.png" alt="Logo" style={{ width: '45px', height: '45px', borderRadius: '10px', objectFit: 'cover' }} />
        <div>
          <h1 style={{ fontSize: '16px', margin: 0, color: '#4CAF50', fontWeight: 'bold' }}>Portacontrol</h1>
          <p style={{ fontSize: '11px', margin: 0, color: '#aaa' }}>Gestión de Autónomo</p>
        </div>
      </div>

      {/* Menú de pestañas */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '15px' }}>
        {['diario', 'mensual', 'anual', 'calendario', 'ajustes'].map(v => (
          <button key={v} onClick={() => setVistaActual(v)} style={{ flex: 1, padding: '10px 2px', borderRadius: '8px', border: 'none', background: vistaActual === v ? '#4CAF50' : '#1e1e1e', color: vistaActual === v ? '#000' : 'white', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '9px', cursor: 'pointer' }}>{v}</button>
        ))}
      </div>

      {/* VISTA DIARIO */}
      {vistaActual === 'diario' && (
        <div>
          {/* Selector de fecha limpio tipo 23/7/2026 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', background: '#1a1a1a', padding: '12px 20px', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
            <button onClick={() => setFecha(new Date(year, month, fecha.getDate()-1))} style={{fontSize: '22px', background:'none', border:'none', color:'white', cursor: 'pointer', padding: '0 5px'}}>&lt;</button>
            <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#fff' }}>
              {fecha.getDate()}/{fecha.getMonth() + 1}/{fecha.getFullYear()}
            </span>
            <button onClick={() => setFecha(new Date(year, month, fecha.getDate()+1))} style={{fontSize: '22px', background:'none', border:'none', color:'white', cursor: 'pointer', padding: '0 5px'}}>&gt;</button>
          </div>

          {/* Selector rápido de IVA */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1a1a1a', padding: '10px 15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #2a2a2a', fontSize: '13px' }}>
            <span>Aplicar IVA ({config.porcentajeIva}%):</span>
            <input type="checkbox" checked={llevaIva} onChange={(e) => setLlevaIva(e.target.checked)} style={{ width: '20px', height: '20px', accentColor: '#4CAF50', cursor: 'pointer' }} />
          </div>

          {/* Sección Ingresos */}
          <div style={{ background: '#1a1a1a', padding: '15px', borderRadius: '12px', marginBottom: '15px', border: '1px solid #2e7d32' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#4CAF50', fontSize: '15px' }}>Ingresos del Día</h3>
            <input type="text" placeholder="Concepto (ej: Portes Madrid)" value={conceptoIngreso} onChange={(e) => setConceptoIngreso(e.target.value)} style={inputStyle} />
            <input type="number" inputMode="decimal" placeholder="Importe (€)" value={ingresoInput} onChange={(e) => setIngresoInput(e.target.value)} style={inputStyle} />
            <button onClick={agregarIngreso} style={{ width: '100%', padding: '12px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>Añadir Ingreso</button>
            
            {datosDia.ingresos?.map(i => (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', background: '#111', padding: '10px', borderRadius: '6px' }}>
                <span style={{ fontSize: '13px' }}>{i.concepto}: <strong>{i.monto.toFixed(2)}€</strong> {i.iva > 0 && <span style={{color: '#aaa', fontSize: '11px'}}>(IVA: {i.iva.toFixed(2)}€)</span>}</span>
                <button onClick={() => eliminarIngreso(i.id)} style={{ background: '#ff4d4d', border: 'none', color: 'white', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
              </div>
            ))}
          </div>

          {/* Sección Gastos Variables */}
          <div style={{ background: '#1a1a1a', padding: '15px', borderRadius: '12px', border: '1px solid #c62828' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#ff4d4d', fontSize: '15px' }}>Gastos Variables (Gasoil, Peajes...)</h3>
            <input type="text" placeholder="Concepto (ej: Gasoil Repsol)" value={conceptoGasto} onChange={(e) => setConceptoGasto(e.target.value)} style={inputStyle} />
            <input type="number" inputMode="decimal" placeholder="Importe (€)" value={gastoInput} onChange={(e) => setGastoInput(e.target.value)} style={inputStyle} />
            <button onClick={agregarGasto} style={{ width: '100%', padding: '12px', background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>Añadir Gasto</button>
            
            {datosDia.gastos?.map(g => (
              <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', background: '#111', padding: '10px', borderRadius: '6px' }}>
                <span style={{ fontSize: '13px' }}>{g.concepto}: <strong>{g.monto.toFixed(2)}€</strong> {g.iva > 0 && <span style={{color: '#aaa', fontSize: '11px'}}>(IVA: {g.iva.toFixed(2)}€)</span>}</span>
                <button onClick={() => eliminarGasto(g.id)} style={{ background: '#ff4d4d', border: 'none', color: 'white', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISTA RESUMEN MENSUAL */}
      {vistaActual === 'mensual' && (
        <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '15px', textTransform: 'capitalize', fontSize: '17px', color: '#fff' }}>Resumen de {fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}><span>Total Facturado (Base):</span><strong style={{color: '#4CAF50'}}>{mesActualTotales.tIngresos.toFixed(2)}€</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', color: '#aaa' }}><span>IVA Repercutido (Cobrado):</span><span>+{mesActualTotales.tIvaRepercutido.toFixed(2)}€</span></div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}><span>Gastos Variables:</span><span style={{color: '#ff4d4d'}}>{mesActualTotales.tGastosVariables.toFixed(2)}€</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}><span>Gastos Fijos:</span><span style={{color: '#ff4d4d'}}>{mesActualTotales.totalGastosFijos.toFixed(2)}€</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', color: '#aaa' }}><span>IVA Soportado (Pagado):</span><span>-{mesActualTotales.tIvaSoportado.toFixed(2)}€</span></div>

          <hr style={{ borderColor: '#333', margin: '15px 0' }}/>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}>
            <span>Balance IVA (A ingresar):</span>
            <strong style={{color: '#2196F3'}}>{mesActualTotales.balanceIva.toFixed(2)}€</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '17px', fontWeight: 'bold', background: '#111', padding: '14px', borderRadius: '8px', border: '1px solid #333' }}>
            <span>Beneficio Neto:</span><span style={{ color: mesActualTotales.beneficioNeto >= 0 ? '#4CAF50' : '#ff4d4d' }}>{mesActualTotales.beneficioNeto.toFixed(2)}€</span>
          </div>
        </div>
      )}

      {/* VISTA RESUMEN ANUAL */}
      {vistaActual === 'anual' && (
        <div style={{ background: '#1a1a1a', padding: '15px', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '15px', fontSize: '18px', color: '#fff' }}>Resumen Anual ({year})</h2>
          {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((nombreMes, index) => {
            const t = calcularTotalesMes(index, year);
            return (
              <div key={nombreMes} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 4px', borderBottom: '1px solid #2a2a2a', fontSize: '13px' }}>
                <span style={{ width: '75px', fontWeight: 'bold', color: '#ddd' }}>{nombreMes}:</span>
                <span style={{ color: '#4CAF50' }}>Ing: {t.tIngresos.toFixed(0)}€</span>
                <span style={{ color: '#ff4d4d' }}>Gas: {t.tGastosTotales.toFixed(0)}€</span>
                <span style={{ fontWeight: 'bold', color: t.beneficioNeto >= 0 ? '#4CAF50' : '#ff4d4d' }}>{t.beneficioNeto.toFixed(0)}€</span>
              </div>
            );
          })}
        </div>
      )}

      {/* VISTA CALENDARIO CON TARJETAS GRANDES Y LETRAS BLANCAS */}
      {vistaActual === 'calendario' && (
        <div style={{ background: '#1a1a1a', padding: '15px', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <button onClick={() => setFecha(new Date(year, month - 1, 1))} style={{ fontSize: '16px', background: '#252525', border: 'none', color: 'white', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer' }}>&lt; Mes</button>
            <h2 style={{ margin: 0, textTransform: 'capitalize', fontSize: '17px', color: '#ffffff', fontWeight: 'bold' }}>{fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h2>
            <button onClick={() => setFecha(new Date(year, month + 1, 1))} style={{ fontSize: '16px', background: '#252525', border: 'none', color: 'white', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer' }}>Mes &gt;</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {['Lu','Ma','Mi','Ju','Vi','Sa','Do'].map(d => <div key={d} style={{ textAlign: 'center', color: '#ffffff', fontSize: '12px', fontWeight: 'bold', paddingBottom: '6px' }}>{d}</div>)}
            {[...Array((new Date(year, month, 1).getDay() + 6) % 7)].map((_, i) => <div key={`empty-${i}`}></div>)}
            {[...Array(new Date(year, month + 1, 0).getDate())].map((_, i) => {
              const diaReal = i + 1;
              const k = `${year}-${(month + 1).toString().padStart(2, '0')}-${diaReal.toString().padStart(2, '0')}`;
              const dInfo = datosDiarios[k];
              const ingDia = (dInfo?.ingresos || []).reduce((acc, x) => acc + x.monto, 0);
              const gasDia = (dInfo?.gastos || []).reduce((acc, x) => acc + x.monto, 0);
              const esHoy = new Date().toDateString() === new Date(year, month, diaReal).toDateString();

              return (
                <button 
                  key={diaReal} 
                  onClick={() => { setFecha(new Date(year, month, diaReal)); setVistaActual('diario'); }} 
                  style={{ 
                    padding: '8px 2px', 
                    background: esHoy ? '#1b3b1c' : '#111812', 
                    border: esHoy ? '2px solid #4CAF50' : '1px solid #1e4620', 
                    color: 'white', 
                    borderRadius: '8px', 
                    fontSize: '13px', 
                    cursor: 'pointer',
                    minHeight: '68px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                  <strong style={{ fontSize: '14px', color: '#fff' }}>{diaReal}</strong>
                  <div style={{ width: '100%', fontSize: '10px', lineHeight: '1.2' }}>
                    {ingDia > 0 && <div style={{ color: '#4CAF50', fontWeight: 'bold' }}>+{ingDia.toFixed(0)}€</div>}
                    {gasDia > 0 && <div style={{ color: '#ff4d4d', fontWeight: 'bold' }}>-{gasDia.toFixed(0)}€</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* VISTA AJUSTES */}
      {vistaActual === 'ajustes' && (
        <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '8px', fontSize: '18px', color: '#fff' }}>Configuración General</h2>
          <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '20px', textAlign: 'center' }}>Gastos fijos mensuales y porcentaje de IVA aplicable.</p>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#4CAF50', fontSize: '14px' }}>Porcentaje de IVA (%)</label>
            <input type="number" inputMode="decimal" value={config.porcentajeIva} onChange={(e) => setConfig({ ...config, porcentajeIva: parseFloat(e.target.value) || 0 })} style={inputStyle} />
          </div>

          <hr style={{ borderColor: '#333', margin: '20px 0' }}/>

          {Object.entries(config).filter(([key]) => key !== 'porcentajeIva').map(([key, val]) => (
            <div key={key} style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', textTransform: 'capitalize', marginBottom: '5px', fontWeight: 'bold', color: '#ddd', fontSize: '14px' }}>{key.replace(/([A-Z])/g, ' $1')}</label>
              <input type="number" inputMode="decimal" value={val} onChange={(e) => setConfig({ ...config, [key]: parseFloat(e.target.value) || 0 })} style={inputStyle} />
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default App;