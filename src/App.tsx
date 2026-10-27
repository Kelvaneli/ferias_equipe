import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  updateProfile,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { 
  auth, 
  db, 
  googleProvider, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { Vacation, UserProfile, PALETTE_COLORS, calculateDaysBetween } from './types';
import { Navbar } from './components/Navbar';
import { VacationCalendar } from './components/VacationCalendar';
import { VacationForm } from './components/VacationForm';
import { VacationTable } from './components/VacationTable';
import { VacationChart } from './components/VacationChart';
import { LoginPrompt } from './components/LoginPrompt';
import { ProfileModal } from './components/ProfileModal';
import { 
  CalendarCheck, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle, 
  UserCog,
  Edit,
  Trash2
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'team_vacations_cache_v1';
const USER_PROFILE_CACHE_KEY = 'team_user_profile_cache_v1';

const INITIAL_DEMO_VACATIONS: Omit<Vacation, 'id'>[] = [
  {
    employeeName: 'Ana Souza',
    startDate: '2026-10-20',
    endDate: '2026-11-03',
    color: '#3b82f6',
    notes: 'Férias de primavera com a família',
    userId: 'demo-user-1',
    userEmail: 'ana.souza@empresa.com'
  },
  {
    employeeName: 'Bruno Lima',
    startDate: '2026-10-25',
    endDate: '2026-11-05',
    color: '#10b981',
    notes: 'Recesso programado do time de engenharia',
    userId: 'demo-user-2',
    userEmail: 'bruno.lima@empresa.com'
  },
  {
    employeeName: 'Camila Duarte',
    startDate: '2026-11-10',
    endDate: '2026-11-25',
    color: '#8b5cf6',
    notes: 'Viagem de intercâmbio e descanso',
    userId: 'demo-user-3',
    userEmail: 'camila.duarte@empresa.com'
  },
  {
    employeeName: 'Diego Ferreira',
    startDate: '2026-11-15',
    endDate: '2026-11-22',
    color: '#f59e0b',
    notes: 'Férias anuais fracionadas',
    userId: 'demo-user-4',
    userEmail: 'diego.ferreira@empresa.com'
  },
  {
    employeeName: 'Mariana Costa',
    startDate: '2026-10-28',
    endDate: '2026-11-08',
    color: '#ec4899',
    notes: 'Compensação de banco de horas e férias',
    userId: 'demo-user-5',
    userEmail: 'mariana.costa@empresa.com'
  }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const cached = localStorage.getItem(USER_PROFILE_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [vacations, setVacations] = useState<Vacation[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn('Falha ao ler cache local:', e);
    }
    return [];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [editingVacation, setEditingVacation] = useState<Vacation | null>(null);
  const [syncStatus, setSyncStatus] = useState<'connected' | 'offline' | 'syncing'>('syncing');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const isAdmin = currentUser?.email === 'kelvaneli@gmail.com';

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Listen to User Profile in Firestore
  useEffect(() => {
    if (!currentUser) {
      setUserProfile(null);
      return;
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setUserProfile(data);
        localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(data));
      } else {
        // Initial setup for new user
        const initialProfile: UserProfile = {
          userId: currentUser.uid,
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Colaborador',
          email: currentUser.email || 'usuario@empresa.com',
          photoURL: currentUser.photoURL || undefined,
          favoriteColor: PALETTE_COLORS[Math.abs(currentUser.uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % PALETTE_COLORS.length],
          jobTitle: 'Membro da Equipe',
          department: 'Engenharia de Software',
          updatedAt: new Date().toISOString()
        };

        // Create default profile in background
        setDoc(userDocRef, initialProfile).catch(err => {
          console.warn('Profile bootstrap note:', err);
        });
        setUserProfile(initialProfile);
      }
    }, (error) => {
      console.warn('Error reading user profile snapshot:', error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Real-time Firestore sync with vacations collection
  useEffect(() => {
    const vacationsCol = collection(db, 'vacations');

    const unsubscribe = onSnapshot(
      vacationsCol,
      (snapshot) => {
        const loaded: Vacation[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });

        // Sort by startDate
        loaded.sort((a, b) => a.startDate.localeCompare(b.startDate));
        setVacations(loaded);
        setSyncStatus('connected');

        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(loaded));
        } catch (e) {
          console.warn('Falha ao salvar no localStorage:', e);
        }
      },
      (error) => {
        console.warn('Modo offline / fallback ativo:', error);
        setSyncStatus('offline');
        // If not authenticated or permission issue, fallback to cache
        try {
          const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (cached && vacations.length === 0) {
            setVacations(JSON.parse(cached));
          }
        } catch (e) {}
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Google Sign In
  const handleLogin = async () => {
    try {
      setAuthLoading(true);
      await signInWithPopup(auth, googleProvider);
      showToast('Login realizado com sucesso via Google!', 'success');
    } catch (error: any) {
      console.error('Erro no login:', error);
      showToast('Falha ao autenticar com o Google. Tente novamente.', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setEditingVacation(null);
      setUserProfile(null);
      showToast('Você saiu da sua conta.', 'info');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  // Save / Update User Profile
  const handleSaveProfile = async (updatedData: Partial<UserProfile>, syncPastVacations: boolean) => {
    if (!currentUser) return;

    const userDocRef = doc(db, 'users', currentUser.uid);
    const nowIso = new Date().toISOString();

    const mergedProfile: UserProfile = {
      userId: currentUser.uid,
      email: currentUser.email || 'usuario@empresa.com',
      displayName: updatedData.displayName || currentUser.displayName || 'Colaborador',
      favoriteColor: updatedData.favoriteColor || userProfile?.favoriteColor || PALETTE_COLORS[0],
      photoURL: updatedData.photoURL || undefined,
      jobTitle: updatedData.jobTitle || undefined,
      department: updatedData.department || undefined,
      phone: updatedData.phone || undefined,
      bio: updatedData.bio || undefined,
      updatedAt: nowIso
    };

    try {
      // 1. Update Firestore user document
      try {
        await setDoc(userDocRef, mergedProfile);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
      }

      // 2. Update Firebase Auth Profile (photo & displayName)
      try {
        await updateProfile(currentUser, {
          displayName: mergedProfile.displayName,
          photoURL: mergedProfile.photoURL || null
        });
      } catch (authErr) {
        console.warn('Auth profile update warning:', authErr);
      }

      // 3. Update local state
      setUserProfile(mergedProfile);
      localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(mergedProfile));

      // 4. Optionally synchronize all past vacations created by this user
      if (syncPastVacations) {
        const myVacations = vacations.filter(v => v.userId === currentUser.uid);
        if (myVacations.length > 0) {
          const batch = writeBatch(db);
          myVacations.forEach(v => {
            const vRef = doc(db, 'vacations', v.id);
            batch.update(vRef, {
              employeeName: mergedProfile.displayName,
              color: mergedProfile.favoriteColor,
              updatedAt: nowIso
            });
          });
          await batch.commit();
        }
      }

      showToast('Perfil e preferências de férias atualizados com sucesso!', 'success');
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      showToast(error.message || 'Erro ao salvar perfil no banco.', 'error');
      throw error;
    }
  };

  // Save Vacation (Create or Update)
  const handleSaveVacation = async (
    vacationData: Omit<Vacation, 'id' | 'userId' | 'userEmail' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!currentUser) {
      handleLogin();
      return;
    }

    setIsSubmitting(true);
    const nowIso = new Date().toISOString();

    try {
      if (editingVacation) {
        // Edit existing
        const docRef = doc(db, 'vacations', editingVacation.id);
        const payload: Partial<Vacation> = {
          employeeName: vacationData.employeeName,
          startDate: vacationData.startDate,
          endDate: vacationData.endDate,
          color: vacationData.color,
          notes: vacationData.notes || '',
          updatedAt: nowIso,
        };

        try {
          await setDoc(docRef, {
            ...editingVacation,
            ...payload
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `vacations/${editingVacation.id}`);
        }

        setEditingVacation(null);
        showToast('Férias atualizadas com sucesso!', 'success');
      } else {
        // Create new
        const newId = 'vac_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const docRef = doc(db, 'vacations', newId);

        const newVacation: Vacation = {
          id: newId,
          employeeName: vacationData.employeeName,
          startDate: vacationData.startDate,
          endDate: vacationData.endDate,
          color: vacationData.color,
          notes: vacationData.notes || '',
          userId: currentUser.uid,
          userEmail: currentUser.email || 'desconhecido@empresa.com',
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        try {
          await setDoc(docRef, newVacation);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `vacations/${newId}`);
        }

        showToast('Férias cadastradas com sucesso no calendário!', 'success');
      }
    } catch (error: any) {
      console.error('Erro ao salvar férias:', error);
      // Fallback local update if network offline
      if (syncStatus === 'offline') {
        const fallbackList = editingVacation 
          ? vacations.map(v => v.id === editingVacation.id ? { ...v, ...vacationData } : v)
          : [...vacations, {
              id: 'local_' + Date.now(),
              ...vacationData,
              userId: currentUser?.uid || 'offline',
              userEmail: currentUser?.email || 'local@offline.com'
            }];
        setVacations(fallbackList);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(fallbackList));
        setEditingVacation(null);
        showToast('Salvo em cache local (offline).', 'info');
      } else {
        showToast(error.message || 'Erro ao comunicar com o Firebase.', 'error');
        throw error;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Vacation
  const handleDeleteVacation = async (vacationId: string) => {
    try {
      const docRef = doc(db, 'vacations', vacationId);
      try {
        await deleteDoc(docRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `vacations/${vacationId}`);
      }

      // Update local list immediately for instant UI response
      const updated = vacations.filter(v => v.id !== vacationId);
      setVacations(updated);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

      showToast('Registro de férias excluído.', 'info');
    } catch (error: any) {
      console.error('Erro ao excluir férias:', error);
      showToast(error.message || 'Não foi possível excluir o registro.', 'error');
    }
  };

  // Seed sample demonstration data
  const handleSeedDemoData = async () => {
    if (!currentUser) {
      handleLogin();
      return;
    }

    try {
      const batch = writeBatch(db);
      const nowIso = new Date().toISOString();

      INITIAL_DEMO_VACATIONS.forEach((item, index) => {
        const id = 'demo_' + Date.now() + '_' + index;
        const ref = doc(db, 'vacations', id);
        batch.set(ref, {
          id,
          ...item,
          userId: currentUser.uid,
          userEmail: currentUser.email || item.userEmail,
          createdAt: nowIso,
          updatedAt: nowIso
        });
      });

      await batch.commit();
      showToast('Dados de demonstração carregados com sucesso no banco!', 'success');
    } catch (error: any) {
      console.error('Erro ao carregar dados de demonstração:', error);
      const mockWithIds = INITIAL_DEMO_VACATIONS.map((item, idx) => ({
        id: 'local_demo_' + idx,
        ...item,
        userId: currentUser?.uid || 'local',
        userEmail: currentUser?.email || item.userEmail
      }));
      setVacations(mockWithIds);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockWithIds));
      showToast('Dados de demonstração carregados localmente.', 'info');
    }
  };

  // Trigger confirmation dialog for clearing user records
  const handleClearMyData = () => {
    if (!currentUser) return;
    const myVacations = vacations.filter(v => v.userId === currentUser.uid || isAdmin);
    if (myVacations.length === 0) {
      showToast('Você não possui registros para remover.', 'info');
      return;
    }
    setIsClearConfirmOpen(true);
  };

  const executeClearMyData = async () => {
    if (!currentUser) return;
    const myVacations = vacations.filter(v => v.userId === currentUser.uid || isAdmin);
    setIsClearConfirmOpen(false);

    try {
      const batch = writeBatch(db);
      myVacations.forEach(v => {
        const ref = doc(db, 'vacations', v.id);
        batch.delete(ref);
      });
      await batch.commit();

      const remaining = vacations.filter(v => !myVacations.some(mv => mv.id === v.id));
      setVacations(remaining);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remaining));
      showToast('Seus registros foram limpos com sucesso.', 'success');
    } catch (error: any) {
      console.error('Erro ao limpar dados:', error);
      showToast('Erro ao remover registros.', 'error');
    }
  };

  // Calculate current user vacation stats for Profile
  const myVacations = currentUser ? vacations.filter(v => v.userId === currentUser.uid) : [];
  const userTotalVacationDays = myVacations.reduce((acc, v) => acc + calculateDaysBetween(v.startDate, v.endDate), 0);
  const userVacationCount = myVacations.length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Navbar */}
      <Navbar
        user={currentUser}
        userProfile={userProfile}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onSeedDemoData={handleSeedDemoData}
        onClearMyData={handleClearMyData}
        hasVacations={vacations.length > 0}
        isAdmin={isAdmin}
      />

      {/* User Profile Modal */}
      {currentUser && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={currentUser}
          profile={userProfile}
          onSaveProfile={handleSaveProfile}
          userTotalVacationDays={userTotalVacationDays}
          userVacationCount={userVacationCount}
        />
      )}

      {/* Confirmation Modal for Clearing User Records */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Limpar meus registros?
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Deseja realmente remover os seus {myVacations.length} períodos de férias cadastrados? Esta ação não pode ser desfeita.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsClearConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeClearMyData}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Sim, remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-3 duration-200">
          <div className={`px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold flex items-center gap-2.5 max-w-md ${
            notification.type === 'success' 
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700' 
              : notification.type === 'error'
              ? 'bg-rose-900 text-rose-100 border-rose-700'
              : 'bg-slate-900 text-slate-100 border-slate-700'
          }`}>
            {notification.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
            {notification.type === 'error' && <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />}
            {notification.type === 'info' && <CalendarCheck className="w-4 h-4 text-indigo-400 shrink-0" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        
        {/* Banner if unauthenticated */}
        {!currentUser && !authLoading && (
          <LoginPrompt onLogin={handleLogin} isLoading={authLoading} />
        )}

        {/* Profile Quick Bar for logged in user */}
        {currentUser && userProfile && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div 
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0"
                style={{ backgroundColor: userProfile.favoriteColor }}
              >
                {userProfile.photoURL ? (
                  <img src={userProfile.photoURL} alt={userProfile.displayName} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  userProfile.displayName.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-800">
                    Olá, {userProfile.displayName}!
                  </h2>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {userProfile.department || 'Equipe'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {userVacationCount > 0 
                    ? `Você possui ${userVacationCount} período(s) agendado(s) totalizando ${userTotalVacationDays} dias.`
                    : 'Você ainda não cadastrou períodos de férias este ano.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/70 rounded-xl transition-all cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs"
            >
              <UserCog className="w-4 h-4 text-indigo-600" />
              <span>Editar Meus Dados de Perfil</span>
            </button>
          </div>
        )}

        {/* Top Split: Form + Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Vacation Registration Form */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <VacationForm
              onSaveVacation={handleSaveVacation}
              editingVacation={editingVacation}
              onCancelEdit={() => setEditingVacation(null)}
              existingVacations={vacations}
              isSubmitting={isSubmitting}
              currentUserProfile={userProfile}
              currentUserEmail={currentUser?.email || undefined}
            />

            {/* Helper card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  i
                </div>
                <div>
                  <p className="font-bold text-slate-800">Transparência da Equipe</p>
                  <p className="text-[11px] text-slate-500">
                    Todos visualizam as datas para evitar ausências simultâneas na mesma área.
                  </p>
                </div>
              </div>

              {currentUser && vacations.some(v => v.userId === currentUser.uid) && (
                <button
                  onClick={handleClearMyData}
                  title="Limpar todos os meus registros cadastrados"
                  className="px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  Limpar Meus
                </button>
              )}
            </div>
          </div>

          {/* Monthly Calendar View */}
          <div className="lg:col-span-7">
            <VacationCalendar
              vacations={vacations}
              onSelectVacationForEdit={(v) => {
                setEditingVacation(v);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              currentUserId={currentUser?.uid}
              isAdmin={isAdmin}
            />
          </div>
        </div>

        {/* Middle Section: Table / List of Registered Entries */}
        <section>
          <VacationTable
            vacations={vacations}
            onEdit={(v) => {
              setEditingVacation(v);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onDelete={handleDeleteVacation}
            currentUserId={currentUser?.uid}
            isAdmin={isAdmin}
          />
        </section>

        {/* Bottom Section: Global Metrics Dashboard with Chart.js */}
        <section>
          <VacationChart vacations={vacations} />
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-6 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">FériasEquipe</span>
            <span>•</span>
            <span>Gestão e Visualização de Férias Compartilhadas</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Firebase Firestore Enterprise</span>
            <span>•</span>
            <span>Autenticação Google</span>
            <span>•</span>
            <span>Chart.js Gráficos</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
