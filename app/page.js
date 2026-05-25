"use client";

import React, { useState, useEffect } from 'react';
import { db } from './firebase'; 
import { collection, addDoc, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

export default function VillaJaveaApp() {
  const [autenticado, setAutenticado] = useState(false);
  const [esAdmin, setEsAdmin] = useState(false); 
  const [password, setPassword] = useState('');
  const [errorAcceso, setErrorAcceso] = useState(false);

  const [reservas, setReservas] = useState([]);
  const [planes, setPlanes] = useState({});

  // Estados para modales y control de edición
  const [modalReserva, setModalReserva] = useState(false);
  const [habitacionSeleccionada, setHabitacionSeleccionada] = useState(1);
  const [nuevaReserva, setNuevaReserva] = useState({ nombre: '', inicio: 8, fin: 9 });
  const [idReservaEdicion, setIdReservaEdicion] = useState(null); // NULL = Crear, STRING = Editar

  const [diaSeleccionado, setDiaSeleccionado] = useState(8);

  const diasAgosto = Array.from({ length: 22 }, (_, i) => i + 8); 
  const diasSemana = ['S', 'D', 'L', 'M', 'X', 'J', 'V']; 

  const coloresReservas = ['bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-purple-500', 'bg-sky-500'];

  // Cargar datos de Firebase en tiempo real
  useEffect(() => {
    if (!autenticado) return;

    const unsubReservas = onSnapshot(collection(db, "reservas"), (snapshot) => {
      const listaReservas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReservas(listaReservas);
    }, (error) => {
      alert("Error al leer de Firebase: " + error.message);
    });

    const unsubPlanes = onSnapshot(collection(db, "planes"), (snapshot) => {
      const objetoPlanes = {};
      snapshot.docs.forEach(doc => {
        objetoPlanes[doc.id] = doc.data();
      });
      setPlanes(objetoPlanes);
    });

    return () => {
      unsubReservas();
      unsubPlanes();
    };
  }, [autenticado]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'Javea2026') {
      setAutenticado(true);
      setEsAdmin(false);
      setErrorAcceso(false);
    } else if (password === 'Adminjavea2026') {
      setAutenticado(true);
      setEsAdmin(true);
      setErrorAcceso(false);
    } else {
      setErrorAcceso(true);
    }
  };

  // Función combinada para crear y MODIFICAR reservas
  const guardarReserva = async (e) => {
    e.preventDefault();
    
    const inicioNum = parseInt(nuevaReserva.inicio);
    const finNum = parseInt(nuevaReserva.fin);

    if (inicioNum >= finNum) {
      alert("⚠️ El día de salida debe ser posterior al día de entrada.");
      return;
    }

    // Validar solapamiento ignorando la propia reserva que estamos editando
    const habitacionOcupada = reservas.some(r => {
      if (r.id === idReservaEdicion) return false; // Al editar, no se solapa consigo misma
      if (r.habitacion !== habitacionSeleccionada) return false;
      return inicioNum < parseInt(r.fin) && finNum > parseInt(r.inicio);
    });

    if (habitacionOcupada) {
      alert("⚠️ La habitación está ocupada para las fechas seleccionadas.");
      return;
    }

    try {
      const datosReserva = {
        nombre: nuevaReserva.nombre,
        inicio: inicioNum,
        fin: finNum,
        habitacion: habitacionSeleccionada
      };

      if (idReservaEdicion) {
        // MODO EDICIÓN: Sobrescribe el documento existente usando su ID en Firebase
        await setDoc(doc(db, "reservas", idReservaEdicion), datosReserva);
      } else {
        // MODO CREACIÓN: Crea un documento nuevo
        await addDoc(collection(db, "reservas"), datosReserva);
      }

      cerrarModal();
    } catch (error) {
      alert("Error en Firebase al procesar la reserva: " + error.message);
    }
  };

  const eliminarReserva = async (e, idReserva, nombrePersona) => {
    e.stopPropagation(); // Evita que se abra el modal de edición al pulsar en borrar
    if (window.confirm(`¿Estás seguro de que quieres cancelar la reserva de ${nombrePersona}?`)) {
      try {
        await deleteDoc(doc(db, "reservas", idReserva));
        cerrarModal();
      } catch (error) {
        alert("No se pudo borrar: " + error.message);
      }
    }
  };

  const actualizarPlan = async (campo, valor) => {
    const nuevoPlanDia = {
      ...planes[diaSeleccionado],
      [campo]: valor
    };
    
    setPlanes({ ...planes, [diaSeleccionado]: nuevoPlanDia });

    try {
      await setDoc(doc(db, "planes", diaSeleccionado.toString()), nuevoPlanDia);
    } catch (error) {
      console.error("Error al guardar plan:", error);
    }
  };

  const abrirModalNuevaReserva = (habitacion, dia) => {
    setHabitacionSeleccionada(habitacion);
    setNuevaReserva({ nombre: '', inicio: dia, fin: dia + 1 });
    setIdReservaEdicion(null); // Especificamos que es una nueva reserva
    setModalReserva(true);
  };

  const abrirModalEditarReserva = (reserva) => {
    setHabitacionSeleccionada(reserva.habitacion);
    setNuevaReserva({ nombre: reserva.nombre, inicio: reserva.inicio, fin: reserva.fin });
    setIdReservaEdicion(reserva.id); // Guardamos el ID para saber que estamos editando
    setModalReserva(true);
  };

  const cerrarModal = () => {
    setModalReserva(false);
    setNuevaReserva({ nombre: '', inicio: 8, fin: 9 });
    setIdReservaEdicion(null);
  };

  if (!autenticado) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">🏠 Villa Javea 2026</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Contraseña de acceso"
              className="w-full p-3 border rounded-lg text-center"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errorAcceso && <p className="text-red-500 text-sm">Contraseña incorrecta</p>}
            <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold shadow hover:bg-blue-700">
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="w-full h-56 md:h-80 bg-cover bg-center relative" style={{ backgroundImage: "url('/image_1.png')" }}>
        <div className="absolute inset-0 bg-black bg-opacity-20 flex p-4 flex-col justify-end items-start">
          <h1 className="text-white text-3xl font-bold shadow-md">Villa La Golondrina</h1>
          {esAdmin && <span className="bg-red-600 text-white text-xs px-2 py-1 rounded mt-2 font-bold shadow">MODO ADMIN ACTIVADO</span>}
        </div>
      </div>

      <div className="p-4 max-w-6xl mx-auto space-y-8">
        
        {/* CALENDARIO */}
        <div className="bg-white rounded-xl shadow p-4 overflow-hidden">
          <h2 className="text-xl font-bold mb-4 text-gray-800">📅 Calendario de Habitaciones (Agosto)</h2>
          <p className="text-xs text-gray-500 mb-3">Pinchando en un hueco libre puedes añadir una reserva. Pinchando en una reserva existente puedes modificar sus días.</p>
          
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[900px]">
              
              {/* Cabecera de días */}
              <div className="grid grid-cols-[100px_repeat(22,_1fr)] gap-px mb-1">
                <div className="font-bold text-sm text-gray-500 flex items-end pb-2">Habitación</div>
                {diasAgosto.map((dia, index) => (
                  <div key={dia} className="text-center text-xs font-semibold bg-gray-100 rounded-t p-1">
                    <div className="text-gray-400">{diasSemana[index % 7]}</div>
                    <div className="text-gray-800 text-sm">{dia}</div>
                  </div>
                ))}
              </div>

              {/* Filas de habitaciones */}
              {[1, 2, 3, 4, 5].map((hab, habIndex) => (
                <div key={hab} className="grid grid-cols-[100px_1fr] gap-x-px mb-1 items-center">
                  
                  <div className="font-semibold text-sm bg-blue-100 text-blue-800 rounded p-2 text-center h-12 flex items-center justify-center">
                    Hab {hab}
                  </div>
                  
                  <div className="relative h-12 bg-gray-50 rounded overflow-hidden">
                    
                    {/* Capa de botones de fondo (Creación) */}
                    <div className="grid grid-cols-[repeat(22,_1fr)] absolute inset-0">
                      {diasAgosto.map(dia => (
                        <div 
                          key={dia} 
                          onClick={() => abrirModalNuevaReserva(hab, dia)}
                          className="h-full border-r border-gray-200/50 last:border-0 hover:bg-blue-50/50 cursor-pointer transition-colors"
                        />
                      ))}
                    </div>

                    {/* Capa de Franjas de Reservas (Modificación) */}
                    <div className="grid grid-cols-[repeat(22,_1fr)] absolute inset-0 pointer-events-none items-center px-px">
                      {reservas.filter(r => r.habitacion === hab).map((res, i) => {
                        const startTrack = res.inicio - 8 + 1;
                        const endTrack = res.fin - 8 + 1;
                        const color = coloresReservas[habIndex % coloresReservas.length];

                        return (
                          <div 
                            key={res.id || i}
                            // AL HACER CLIC: Abre el modal para modificar fechas de esta reserva
                            onClick={() => abrirModalEditarReserva(res)}
                            style={{ gridColumnStart: startTrack, gridColumnEnd: endTrack }}
                            className={`pointer-events-auto h-8 ${color} text-white text-xs flex items-center justify-between rounded shadow-sm px-2 border border-white font-semibold mx-0.5 relative overflow-hidden cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all`}
                            title={`Haga clic para editar la reserva de ${res.nombre}`}
                          >
                            <span className="truncate pr-1">{res.nombre}</span>
                            
                            {/* Botón de borrado (Solo visible e interactivo para el Admin) */}
                            {esAdmin && (
                              <button 
                                onClick={(e) => eliminarReserva(e, res.id, res.nombre)}
                                className="font-bold bg-black bg-opacity-20 hover:bg-red-700 w-5 h-5 rounded-full flex items-center justify-center text-white transition-colors"
                                title="Eliminar definitivamente"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PLANNING DIARIO */}
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="text-xl font-bold mb-4 text-gray-800">🍽️ Planning Diario (Día {diaSeleccionado})</h2>
          
          <div className="flex space-x-2 overflow-x-auto pb-2 mb-4">
            {diasAgosto.map(dia => (
              <button 
                key={dia} 
                onClick={() => setDiaSeleccionado(dia)}
                className={`px-4 py-2 rounded-lg font-semibold min-w-[50px] ${diaSeleccionado === dia ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                {dia}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700">Comida</label>
              <textarea 
                className="w-full mt-1 p-2 border rounded-lg" 
                rows="2" 
                placeholder="Ej: Paella en el chiringuito..."
                value={planes[diaSeleccionado]?.comida || ''}
                onChange={(e) => actualizarPlan('comida', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700">Cena</label>
              <textarea 
                className="w-full mt-1 p-2 border rounded-lg" 
                rows="2" 
                placeholder="Ej: Barbacoa en la casa..."
                value={planes[diaSeleccionado]?.cena || ''}
                onChange={(e) => actualizarPlan('cena', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700">Plan del día</label>
              <textarea 
                className="w-full mt-1 p-2 border rounded-lg" 
                rows="2" 
                placeholder="Ej: Mañana de playa, tarde piscina..."
                value={planes[diaSeleccionado]?.plan || ''}
                onChange={(e) => actualizarPlan('plan', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* UBICACIÓN */}
        <div className="bg-white rounded-xl shadow p-4 space-y-4">
          <h2 className="text-xl font-bold text-gray-800">📍 Ubicación e Información</h2>
          <a href="https://alojamientos.marhenhomes.com/alquiler/villa-javea-villa-la-golondrina-by-marhen-homes-559597.html" target="_blank" rel="noreferrer" className="block w-full text-center bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-700">
            Ver más detalles y fotos de la casa
          </a>
          <div className="w-full h-64 rounded-lg overflow-hidden border shadow-inner">
            {/* NUEVO IFRAME ACTUALIZADO CON TU ENLACE MAPS DE MARHEN HOMES */}
            <iframe 
              width="100%" 
              height="100%" 
              frameBorder="0" 
              scrolling="no" 
              marginHeight="0" 
              marginWidth="0" 
              src="https://maps.google.com/maps?q=Javea,Alicante&t=&z=13&ie=UTF8&iwloc=&output=embed3">
            </iframe>
          </div>
        </div>
      </div>

      {/* MODAL RESERVA (SIRVE PARA NUEVAS Y PARA MODIFICAR) */}
      {modalReserva && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold mb-4">
              {idReservaEdicion ? `Modificar Reserva Habitación ${habitacionSeleccionada}` : `Reservar Habitación ${habitacionSeleccionada}`}
            </h3>
            <form onSubmit={guardarReserva} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nombre</label>
                <input required type="text" className="w-full p-2 border rounded" value={nuevaReserva.nombre} onChange={e => setNuevaReserva({...nuevaReserva, nombre: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Día Entrada</label>
                  <select className="w-full p-2 border rounded" value={nuevaReserva.inicio} onChange={e => setNuevaReserva({...nuevaReserva, inicio: parseInt(e.target.value)})}>
                    {diasAgosto.map(d => <option key={d} value={d}>Agosto {d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Día Salida</label>
                  <select className="w-full p-2 border rounded" value={nuevaReserva.fin} onChange={e => setNuevaReserva({...nuevaReserva, fin: parseInt(e.target.value)})}>
                    {diasAgosto.map(d => <option key={d} value={d}>Agosto {d}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button type="button" onClick={cerrarModal} className="flex-1 bg-gray-200 text-gray-800 p-2 rounded">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white p-2 rounded font-bold">
                  {idReservaEdicion ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
