import { useState, useEffect } from 'react';

function App() {
  const [vistaActual, setVistaActual] = useState('diario');
  const [fecha, setFecha] = useState(new Date());

  // Ajustes iniciales (Gastos fijos mensuales como cuota de camión, seguros, etc.)
  const [config, setConfig] = useState(() => {
    const guardado = localStorage.getItem('portacontrol_ajustes');
    return guardado ? JSON.parse(guardado) : {
      cuotaCamion: 1200,
      seguro: 350,
      gestoria: 100,
      otrosFijos: 200
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
      const nuevoIngreso = { id: Date.now(), concepto: conceptoIngreso || 'Viaje / Portacoches', monto };
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
      const nuevoGasto = { id: Date.now(), concepto: conceptoGasto || 'Gasoil / Varios', monto };
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

  // Cálculo mensual (incluyendo la suma de los gastos fijos configurados)
  const calcularTotalesMes = (m, y) => {
    let tIngresos = 0;
    let tGastosVariables = 0;
    const prefijo = `${y}-${(m + 1).toString().padStart(2, '0')}`;

    Object.keys(datosDiarios).forEach(key => {
      if (key.startsWith(prefijo)) {
        const d = datosDiarios[key];
        tIngresos += (d.ingresos || []).reduce((sum, i) => sum + i.monto, 0);
        tGastosVariables += (d.gastos || []).reduce((sum, g) => sum + g.monto, 0);
      }
    });

    const totalGastosFijos = Object.values(config).reduce((a, b) => a + (parseFloat(b) || 0), 0);
    const tGastosTotales = tGastosVariables + totalGastosFijos;
    const beneficioNeto = tIngresos - tGastosTotales;

    return { tIngresos, tGastosVariables, totalGastosFijos, tGastosTotales, beneficioNeto };
  };

  const mesActualTotales = calcularTotalesMes(month, year);

  const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', fontSize: '16px', border: '1px solid #444', backgroundColor: '#000', color: '#fff', boxSizing: 'border-box', marginBottom: '10px' };

  return (
    <div style={{ padding: '20px', backgroundColor: '#121212', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      
      {/* Cabecera con el logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', background: '#1e1e1e', padding: '15px', borderRadius: '12px' }}>
        <img src="/icono.png" alt="Logo" style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover' }} />
        <div>
          <h1 style={{ fontSize: '18px', margin: 0, color: '#4CAF50' }}>Portacontrol</h1>
          <p style={{ fontSize: '12px', margin: 0, color: '#aaa' }}>Gestión de Autónomo</p>
        </div>
      </div>

      {/* Menú de pestañas */}
      <div style={{ display: 'flex', gap: '5px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['diario', 'mensual', 'anual', 'calendario', 'ajustes'].map(v => (
          <button key={v} onClick={() => setVistaActual(v)} style={{ flex: 1, minWidth: '60px', padding: '10px 5px', borderRadius: '8px', border: 'none', background: vistaActual === v ? '#4CAF50' : '#333', color: vistaActual === v ? '#000' : 'white', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10px', cursor: 'pointer' }}>{v}</button>
        ))}
      </div>

      {/* VISTA DIARIO */}
      {vistaActual === 'diario' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: '#1e1e1e', padding: '15px', borderRadius: '12px' }}>
            <button onClick={() => setFecha(new Date(year, month, fecha.getDate()-1))} style={{fontSize: '20px', background:'none', border:'none', color:'white', cursor: 'pointer', padding: '0 10px'}}>&lt;</button>
            <span style={{ fontWeight: 'bold', fontSize: '16px', textTransform: 'capitalize' }}>{fecha.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <button onClick={() => setFecha(new Date(year, month, fecha.getDate()+1))} style={{fontSize: '20px', background:'none', border:'none', color:'white', cursor: 'pointer', padding: '0 10px'}}>&gt;</button>
          </div>

          {/* Sección Ingresos */}
          <div style={{ background: '#1a1a1a', padding: '15px', borderRadius: '12px', marginBottom: '15px', border: '1px solid #2e7d32' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#4CAF50', fontSize: '16px' }}>Ingresos del Día</h3>
            <input type="text" placeholder="Concepto (ej: Portes Madrid)" value={conceptoIngreso} onChange={(e) => setConceptoIngreso(e.target.value)} style={inputStyle} />
            <input type="number" inputMode="decimal" placeholder="Importe (€)" value={ingresoInput} onChange={(e) => setIngresoInput(e.target.value)} style={inputStyle} />
            <button onClick={agregarIngreso} style={{ width: '100%', padding: '12px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Añadir Ingreso</button>
            
            {datosDia.ingresos?.map(i => (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', background: '#111', padding: '10px', borderRadius: '6px' }}>
                <span>{i.concepto}: <strong>{i.monto.toFixed(2)}€</strong></span>
                <button onClick={() => eliminarIngreso(i.id)} style={{ background: '#ff4d4d', border: 'none', color: 'white', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>X</button>
              </div>
            ))}
          </div>

          {/* Sección Gastos Variables */}
          <div style={{ background: '#1a1a1a', padding: '15px', borderRadius: '12px', border: '1px solid #c62828' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#ff4d4d', fontSize: '16px' }}>Gastos Variables (Gasoil, Peajes...)</h3>
            <input type="text" placeholder="Concepto (ej: Gasoil Repsol)" value={conceptoGasto} onChange={(e) => setConceptoGasto(e.target.value)} style={inputStyle} />
            <input type="number" inputMode="decimal" placeholder="Importe (€)" value={gastoInput} onChange={(e) => setGastoInput(e.target.value)} style={inputStyle} />
            <button onClick={agregarGasto} style={{ width: '100%', padding: '12px', background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Añadir Gasto</button>
            
            {datosDia.gastos?.map(g => (
              <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', background: '#111', padding: '10px', borderRadius: '6px' }}>
                <span>{g.concepto}: <strong>{g.monto.toFixed(2)}€</strong></span>
                <button onClick={() => eliminarGasto(g.id)} style={{ background: '#ff4d4d', border: 'none', color: 'white', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>X</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISTA RESUMEN MENSUAL */}
      {vistaActual === 'mensual' && (
        <div style={{ background: '#1e1e1e', padding: '20px', borderRadius: '12px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px', textTransform: 'capitalize' }}>Resumen de {fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span>Total Facturado (Ingresos):</span><strong style={{color: '#4CAF50'}}>{mesActualTotales.tIngresos.toFixed(2)}€</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span>Gastos Variables (Día a día):</span><span style={{color: '#ff4d4d'}}>{mesActualTotales.tGastosVariables.toFixed(2)}€</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span>Gastos Fijos (Cuota, Seguros...):</span><span style={{color: '#ff4d4d'}}>{mesActualTotales.totalGastosFijos.toFixed(2)}€</span></div>
          <hr style={{ borderColor: '#444', margin: '15px 0' }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '16px' }}><span>Total Gastos:</span><strong style={{color: '#ff4d4d'}}>{mesActualTotales.tGastosTotales.toFixed(2)}€</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold', background: '#222', padding: '15px', borderRadius: '8px' }}>
            <span>Beneficio Neto:</span><span style={{ color: mesActualTotales.beneficioNeto >= 0 ? '#4CAF50' : '#ff4d4d' }}>{mesActualTotales.beneficioNeto.toFixed(2)}€</span>
          </div>
        </div>
      )}

      {/* VISTA RESUMEN ANUAL */}
      {vistaActual === 'anual' && (
        <div style={{ background: '#1e1e1e', padding: '20px', borderRadius: '12px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Resumen Anual ({year})</h2>
          {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((nombreMes, index) => {
            const t = calcularTotalesMes(index, year);
            return (
              <div key={nombreMes} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #333', fontSize: '14px' }}>
                <span style={{ width: '80px', fontWeight: 'bold' }}>{nombreMes}:</span>
                <span style={{ color: '#4CAF50' }}>Ing: {t.tIngresos.toFixed(0)}€</span>
                <span style={{ color: '#ff4d4d' }}>Gas: {t.tGastosTotales.toFixed(0)}€</span>
                <span style={{ fontWeight: 'bold', color: t.beneficioNeto >= 0 ? '#4CAF50' : '#ff4d4d' }}>{t.beneficioNeto.toFixed(0)}€</span>
              </div>
            );
          })}
        </div>
      )}

      {/* VISTA CALENDARIO MEJORADA */}
      {vistaActual === 'calendario' && (
        <div style={{ background: '#1e1e1e', padding: '15px', borderRadius: '12px' }}>
          {/* Cabecera del calendario con flechas para cambiar de mes */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <button onClick={() => setFecha(new Date(year, month - 1, 1))} style={{ fontSize: '18px', background: '#333', border: 'none', color: 'white', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer' }}>&lt; Mes</button>
            <h2 style={{ margin: 0, textTransform: 'capitalize', fontSize: '16px', color: '#4CAF50' }}>{fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h2>
            <button onClick={() => setFecha(new Date(year, month + 1, 1))} style={{ fontSize: '18px', background: '#333', border: 'none', color: 'white', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer' }}>Mes &gt;</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {['Lu','Ma','Mi','Ju','Vi','Sa','Do'].map(d => <div key={d} style={{ textAlign: 'center', color: '#888', fontSize: '11px', fontWeight: 'bold', paddingBottom: '8px' }}>{d}</div>)}
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
                    background: esHoy ? '#2a472b' : '#141414', 
                    border: esHoy ? '2px solid #4CAF50' : '1px solid #2a2a2a', 
                    color: 'white', 
                    borderRadius: '8px', 
                    fontSize: '12px', 
                    cursor: 'pointer',
                    minHeight: '55px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                  <strong style={{ fontSize: '13px' }}>{diaReal}</strong>
                  <div style={{ width: '100%', fontSize: '9px', lineHeight: '1.1' }}>
                    {ingDia > 0 && <div style={{ color: '#4CAF50', fontWeight: 'bold' }}>+{ingDia.toFixed(0)}</div>}
                    {gasDia > 0 && <div style={{ color: '#ff4d4d' }}>-{gasDia.toFixed(0)}</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* VISTA AJUSTES (Gastos Fijos) */}
      {vistaActual === 'ajustes' && (
        <div style={{ background: '#1e1e1e', padding: '20px', borderRadius: '12px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>Gastos Fijos Mensuales</h2>
          <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '20px', textAlign: 'center' }}>Modifica tus cuotas fijas; se restarán automáticamente todos los meses.</p>
          {Object.entries(config).map(([key, val]) => (
            <div key={key} style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', textTransform: 'capitalize', marginBottom: '5px', fontWeight: 'bold', color: '#ddd' }}>{key.replace(/([A-Z])/g, ' $1')}</label>
              <input type="number" inputMode="decimal" value={val} onChange={(e) => setConfig({ ...config, [key]: parseFloat(e.target.value) || 0 })} style={inputStyle} />
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default App;