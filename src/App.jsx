import { useState, useEffect } from 'react';

function App() {
  const [vistaActual, setVistaActual] = useState('inicio');

  // Estado para los datos contables y de gastos de autónomo de Portacontrol
  const [datosPorta, setDatosPorta] = useState(() => {
    const guardado = localStorage.getItem('portacontrol_datos_v1');
    return guardado ? JSON.parse(guardado) : {
      gastos: [],
      ingresos: [],
      config: { irpfDefault: 15, cuotaAutonomo: 300 }
    };
  });

  const [nuevoGastoConcepto, setNuevoGastoConcepto] = useState('');
  const [nuevoGastoMonto, setNuevoGastoMonto] = useState('');
  const [nuevoGastoCategoria, setNuevoGastoCategoria] = useState('Combustible');

  useEffect(() => {
    localStorage.setItem('portacontrol_datos_v1', JSON.stringify(datosPorta));
  }, [datosPorta]);

  // Función para exportar la copia de seguridad en JSON
  const exportarDatos = async () => {
    const copia = { app: 'Portacontrol', version: 1, fechaCopia: new Date().toISOString(), datosPorta };
    const contenido = JSON.stringify(copia, null, 2);
    const archivo = new File([contenido], `copia-seguridad-portacontrol-${new Date().toISOString().slice(0, 10)}.json`, { type: 'application/json' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [archivo] })) {
      try {
        await navigator.share({ title: 'Copia de seguridad - Portacontrol', files: [archivo] });
        return;
      } catch (error) { if (error?.name === 'AbortError') return; }
    }

    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = archivo.name;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  };

  // Función para importar y restaurar los datos
  const importarDatos = (event) => {
    const archivo = event.target.files?.[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = (e) => {
      try {
        const copia = JSON.parse(e.target.result);
        if (!copia || !copia.datosPorta) throw new Error('Formato no válido');
        if (!window.confirm('¿Quieres sustituir los datos actuales por esta copia de seguridad?')) return;
        setDatosPorta(copia.datosPorta);
        alert('¡Copia de seguridad restaurada correctamente!');
      } catch (error) {
        alert('No se ha podido importar el archivo.');
      } finally {
        event.target.value = '';
      }
    };
    lector.readAsText(archivo);
  };

  const agregarGasto = (e) => {
    e.preventDefault();
    const monto = parseFloat(nuevoGastoMonto);
    if (!nuevoGastoConcepto.trim() || isNaN(monto) || monto <= 0) {
      alert('Introduce un concepto y un importe válido.');
      return;
    }
    const nuevo = {
      id: Date.now(),
      concepto: nuevoGastoConcepto.trim(),
      monto: monto,
      categoria: nuevoGastoCategoria,
      fecha: new Date().toISOString().slice(0, 10)
    };
    setDatosPorta(prev => ({
      ...prev,
      gastos: [nuevo, ...(prev.gastos || [])]
    }));
    setNuevoGastoConcepto('');
    setNuevoGastoMonto('');
  };

  const eliminarGasto = (id) => {
    if (window.confirm('¿Eliminar este gasto?')) {
      setDatosPorta(prev => ({
        ...prev,
        gastos: prev.gastos.filter(g => g.id !== id)
      }));
    }
  };

  const totalGastos = (datosPorta.gastos || []).reduce((acc, g) => acc + g.monto, 0);

  return (
    <div style={{ minHeight: '100vh', padding: '16px 14px 90px', background: '#07130d', color: '#f4faf6', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* ENCABEZADO */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ color: '#9db1a4', fontSize: '10px', fontWeight: '800', letterSpacing: '.1em', textTransform: 'uppercase' }}>Control Autónomo Portacoches</div>
            <div style={{ fontSize: '26px', fontWeight: '850', marginTop: '2px', color: '#34c759' }}>🚛 Portacontrol</div>
          </div>
          <button 
            onClick={() => setVistaActual(vistaActual === 'ajustes' ? 'inicio' : 'ajustes')} 
            style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#0e1d15', border: '1px solid #294336', color: '#f4faf6', fontSize: '18px', cursor: 'pointer' }}
          >
            {vistaActual === 'ajustes' ? '🏠' : '⚙️'}
          </button>
        </header>

        {/* NAVEGACIÓN RÁPIDA */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
          <button 
            onClick={() => setVistaActual('inicio')}
            style={{ padding: '12px', borderRadius: '12px', background: vistaActual === 'inicio' ? '#34c759' : '#0e1d15', color: vistaActual === 'inicio' ? '#000' : '#f4faf6', border: '1px solid #294336', fontWeight: 'bold', cursor: 'pointer' }}
          >
            📊 Gastos y Resumen
          </button>
          <button 
            onClick={() => setVistaActual('ajustes')}
            style={{ padding: '12px', borderRadius: '12px', background: vistaActual === 'ajustes' ? '#34c759' : '#0e1d15', color: vistaActual === 'ajustes' ? '#000' : '#f4faf6', border: '1px solid #294336', fontWeight: 'bold', cursor: 'pointer' }}
          >
            ⚙️ Ajustes y Copias
          </button>
        </div>

        {/* CONTENIDO SEGÚN VISTA */}
        {vistaActual === 'inicio' ? (
          <div>
            {/* TARJETA RESUMEN */}
            <div style={{ background: '#0e1d15', border: '1px solid #294336', borderRadius: '16px', padding: '20px', marginBottom: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.4)' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#9db1a4' }}>Total Gastos Registrados</h3>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#ff6258' }}>{totalGastos.toFixed(2)}€</div>
            </div>

            {/* FORMULARIO NUEVO GASTO */}
            <div style={{ background: '#0e1d15', border: '1px solid #294336', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '16px' }}>➕ Añadir Gasto de Autónomo</h3>
              <form onSubmit={agregarGasto} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input 
                  type="text" 
                  value={nuevoGastoConcepto} 
                  onChange={(e) => setNuevoGastoConcepto(e.target.value)} 
                  placeholder="Concepto (ej: Gasoil, Repuesto camión...)" 
                  style={{ padding: '12px', borderRadius: '10px', background: '#14271c', border: '1px solid #294336', color: '#f4faf6', fontSize: '14px', boxSizing: 'border-box', width: '100%' }}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="number" 
                    inputMode="decimal" 
                    step="any" 
                    value={nuevoGastoMonto} 
                    onChange={(e) => setNuevoGastoMonto(e.target.value)} 
                    placeholder="Importe (€)" 
                    style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#14271c', border: '1px solid #294336', color: '#f4faf6', fontSize: '14px' }}
                  />
                  <select 
                    value={nuevoGastoCategoria} 
                    onChange={(e) => setNuevoGastoCategoria(e.target.value)}
                    style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#14271c', border: '1px solid #294336', color: '#f4faf6', fontSize: '14px' }}
                  >
                    <option value="Combustible">Combustible</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Impuestos">Impuestos / Cuota</option>
                    <option value="Varios">Varios</option>
                  </select>
                </div>
                <button type="submit" style={{ padding: '12px', borderRadius: '10px', background: '#34c759', color: '#000', border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '4px' }}>Guardar Gasto</button>
              </form>
            </div>

            {/* LISTADO DE GASTOS */}
            <div style={{ background: '#0e1d15', border: '1px solid #294336', borderRadius: '16px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '16px' }}>📋 Historial de Gastos</h3>
              {(!datosPorta.gastos || datosPorta.gastos.length === 0) ? (
                <div style={{ color: '#9db1a4', fontSize: '14px', fontStyle: 'italic' }}>No hay gastos registrados todavía.</div>
              ) : (
                datosPorta.gastos.map(g => (
                  <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#14271c', borderRadius: '10px', border: '1px solid #294336', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: '#34c759', fontWeight: 'bold', textTransform: 'uppercase' }}>{g.categoria} • {g.fecha}</div>
                      <div style={{ fontSize: '15px', fontWeight: 'bold', marginTop: '2px' }}>{g.concepto}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#ff6258' }}>-{g.monto.toFixed(2)}€</span>
                      <button onClick={() => eliminarGasto(g.id)} style={{ background: '#ff625822', color: '#ff6258', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontWeight: 'bold' }}>🗑️</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* VISTA AJUSTES Y COPIAS DE SEGURIDAD */
          <div style={{ background: '#0e1d15', border: '1px solid #294336', borderRadius: '16px', padding: '20px' }}>
            <h2 style={{ textAlign: 'center', margin: '0 0 20px 0', fontSize: '18px' }}>⚙️ Ajustes y Copias de Seguridad</h2>
            
            <p style={{ fontSize: '13px', color: '#9db1a4', lineHeight: '1.5', marginBottom: '20px' }}>
              Utiliza estas opciones para exportar tus datos en un archivo JSON o restaurarlos si cambias de dispositivo o actualizas el teléfono.
            </p>

            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
              <button 
                onClick={exportarDatos} 
                style={{ padding: '14px', borderRadius: '12px', background: '#34c759', color: '#000', border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}
              >
                📤 Exportar Copia de Seguridad
              </button>

              <label style={{ padding: '14px', borderRadius: '12px', background: '#14271c', border: '1px solid #294336', color: '#f4faf6', fontWeight: 'bold', textAlign: 'center', cursor: 'pointer', fontSize: '15px' }}>
                📥 Restaurar / Importar Copia
                <input type="file" accept=".json,application/json" onChange={importarDatos} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;