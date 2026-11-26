import React, { useState, useEffect } from 'react';
import { login, getCurrentUser, apiRequest } from './api';
import {
  LayoutDashboard, FileText, Upload, Users, Package, History,
  Search, Bell, Plus, ArrowUpRight, ArrowDownRight, AlertTriangle,
  CheckCircle2, Clock, MoreHorizontal, Menu, X, ChevronRight,
  FileUp, Sparkles, ShieldCheck, Eye, Settings, CircleHelp,
  Download, Filter, Check, FileCheck2, Activity, ScanText
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid
} from 'recharts';

const chartData = [
  {name:'Lun', value:320000}, {name:'Mar',value:480000},
  {name:'Mer',value:380000}, {name:'Jeu',value:620000},
  {name:'Ven',value:520000}, {name:'Sam',value:780000},
  {name:'Dim',value:690000}
];

const initialInvoices = [
  {id:'FAC-2026-008',client:'NovaTech Solutions',date:'25 nov. 2026',amount:485000,status:'Validée'},
  {id:'FAC-2026-007',client:'Bénin Digital',date:'24 nov. 2026',amount:275000,status:'Brouillon'},
  {id:'FAC-2026-006',client:'AgroPlus SARL',date:'23 nov. 2026',amount:1250000,status:'Validée'},
  {id:'FAC-2026-005',client:'Kora Distribution',date:'22 nov. 2026',amount:89000,status:'Anomalie'},
  {id:'FAC-2026-004',client:'MédiaCom Afrique',date:'21 nov. 2026',amount:350000,status:'En revue'},
  {id:'FAC-2026-003',client:'NovaTech Solutions',date:'20 nov. 2026',amount:620000,status:'Validée'},
];

const initialClients = [
  {name:'NovaTech Solutions',email:'contact@novatech.bj',type:'Entreprise'},
  {name:'Bénin Digital',email:'hello@benindigital.bj',type:'Entreprise'},
  {name:'AgroPlus SARL',email:'contact@agroplus.bj',type:'Entreprise'},
  {name:'Kora Distribution',email:'kora@email.com',type:'Entreprise'},
  {name:'MédiaCom Afrique',email:'info@mediacom.bj',type:'Entreprise'},
];

const initialProducts = [
  {name:'Ordinateur portable Pro',ref:'PRD-001',price:450000},
  {name:'Licence logiciel annuel',ref:'PRD-002',price:75000},
  {name:'Consulting digital',ref:'PRD-003',price:125000},
  {name:'Formation professionnelle',ref:'PRD-004',price:150000},
];

const nav = [
  {label:'Vue d’ensemble',icon:LayoutDashboard,id:'dashboard'},
  {label:'Documents',icon:FileText,id:'documents'},
  {label:'Factures',icon:FileCheck2,id:'invoices'},
  {label:'Clients',icon:Users,id:'clients'},
  {label:'Catalogue',icon:Package,id:'products'},
  {label:'Journal d’activité',icon:History,id:'journal'},
];

const fmt = n => new Intl.NumberFormat('fr-FR').format(n)+' FCFA';

function Status({status}) {
  const map = {
    'Validée':'green','Brouillon':'gray','Anomalie':'red','En revue':'orange'
  };
  return <span className={`badge ${map[status]||'gray'}`}><span className="dot"/>{status}</span>;
}

function App(){
  const [user,setUser] = useState(null);
  const [authLoading,setAuthLoading] = useState(true);
  const [authError,setAuthError] = useState('');
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  useEffect(() => {
    async function checkAuth() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch {
        sessionStorage.removeItem('faktsure_token');
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const data = await login(email, password);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      toast('Connexion réussie.');
    } catch (error) {
      setAuthError(error.message || 'Identifiants incorrects.');
    } finally {
      setAuthLoading(false);
    }
  }
  const [page,setPage] = useState('dashboard');
  const [mobileOpen,setMobileOpen] = useState(false);
  const [search,setSearch] = useState('');
  const [invoices,setInvoices] = useState(initialInvoices);
  const [clients,setClients] = useState(initialClients);
  const [products,setProducts] = useState(initialProducts);
  const [journal,setJournal] = useState([{action:'Espace de démonstration initialisé',time:'À l’instant'}]);
  const [showImport,setShowImport] = useState(false);
  const [showAdd,setShowAdd] = useState(false);
  const [selectedInvoice,setSelectedInvoice] = useState(null);
  const [notification,setNotification] = useState('');
  const [files,setFiles] = useState([]);
  const [analysisData,setAnalysisData] = useState(null);

  function log(action){
    setJournal(prev=>[{action,time:'À l’instant'},...prev]);
  }
  function toast(msg){
    setNotification(msg);
    setTimeout(()=>setNotification(''),2800);
  }
  function go(id){
    setPage(id);
    setMobileOpen(false);
    setSelectedInvoice(null);
  }
  async function simulateAnalysis(){
    if (!files.length || !(files[0] instanceof File)) {
      toast("Importe un fichier PDF.");
      return;
    }

    const file = files[0];

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast("Utilise un PDF pour cette démonstration.");
      return;
    }

    try {
      toast("Création du lot...");

      const batch = await apiRequest("/batches", {
        method: "POST",
        body: JSON.stringify({name: file.name})
      });

      const fd = new FormData();
      fd.append("files", file);

      const uploaded = await apiRequest(
        `/batches/${batch.public_id}/documents`,
        {method: "POST", body: fd}
      );

      const result = uploaded.results?.find(
        x => x.document_id && ["uploaded", "duplicate"].includes(x.status)
      );

      if (!result) {
        throw new Error(uploaded.results?.[0]?.error || "Échec de l'import.");
      }

      await apiRequest(`/batches/${batch.public_id}/process`, {
        method: "POST"
      });

      toast("Document envoyé à l'IA...");

      let current;

      for (let i = 0; i < 45; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        current = await apiRequest(`/batches/${batch.public_id}`);

        if (["COMPLETED", "PARTIALLY_COMPLETED"].includes(current.status)) {
          break;
        }
      }

      if (!current || !["COMPLETED", "PARTIALLY_COMPLETED"].includes(current.status)) {
        throw new Error("Traitement trop long. Réessaie.");
      }

      const [fields, anomalies, document] = await Promise.all([
        apiRequest(`/documents/${result.document_id}/fields`),
        apiRequest(`/documents/${result.document_id}/anomalies`),
        apiRequest(`/documents/${result.document_id}`)
      ]);

      const values = Object.fromEntries(
        fields.map(f => [f.field_name, f.corrected_value ?? f.value])
      );

      const num = v =>
        Number(String(v ?? 0).replace(/[^0-9,.-]/g, "").replace(",", ".")) || 0;

      const quantity = num(values.quantity) || 1;
      const unitPrice = num(values.unit_price || values.unitPrice);
      const subtotal = num(values.subtotal) || quantity * unitPrice;
      const tax = num(values.tax_total || values.vat_amount);
      const grandTotal = num(values.grand_total || values.total_ttc);
      const vat = subtotal > 0 && tax > 0 ? tax / subtotal * 100 : 0;

      setShowImport(false);
      setPage("documents");

      setAnalysisData({
        source: file.name,
        supplier: values.supplier_name || values.supplier || "Non détecté",
        client: values.client_name || "Non détecté",
        date: values.document_date || "Non détectée",
        description: values.description || values.item_description || file.name,
        quantity,
        unitPrice,
        vat,
        subtotal,
        tax,
        grandTotal,
        currency: values.currency || "XOF",
        fields,
        anomalies,
        documentId: result.document_id,
        documentStatus: document.status
      });

      log("Extraction réelle effectuée par FaktSure AI");
      toast("Extraction terminée. Vérifie les données.");

    } catch (error) {
      console.error(error);
      toast(error.message || "Erreur lors de l'analyse.");
    }
  }

  function confirmAnalysis(data){
    const id = `FAC-2026-${String(invoices.length+9).padStart(3,'0')}`;
    const amount = Math.round(data.quantity * data.unitPrice * (1 + data.vat/100));
    const newInv = {
      id,
      client: data.client,
      date: data.date,
      amount,
      status: 'Brouillon'
    };
    setInvoices(prev=>[newInv,...prev]);
    log(`Facture ${id} créée à partir de ${data.source}`);
    setAnalysisData(null);
    setSelectedInvoice(newInv);
    toast('Facture brouillon créée.');
  }
  function validateInvoice(inv){
    setInvoices(prev=>prev.map(x=>x.id===inv.id?{...x,status:'Validée'}:x));
    log(`Facture ${inv.id} validée`);
    setSelectedInvoice(null);
    toast('Facture validée avec succès.');
  }
  function addInvoice(){
    const newInv={id:`FAC-2026-${String(invoices.length+9).padStart(3,'0')}`,client:'Nouveau client',date:'25 nov. 2026',amount:250000,status:'Brouillon'};
    setInvoices(prev=>[newInv,...prev]);
    setShowAdd(false);
    log('Nouveau brouillon de facture créé');
    setSelectedInvoice(newInv);
  }
  function addClient(){
    const name=prompt('Nom du client :');
    if(!name)return;
    setClients(prev=>[{name,email:'contact@example.com',type:'Entreprise'},...prev]);
    log(`Client ${name} ajouté`);
    toast('Client ajouté.');
  }
  function addProduct(){
    const name=prompt('Nom du produit :');
    if(!name)return;
    setProducts(prev=>[{name,ref:'PRD-'+(prev.length+1).toString().padStart(3,'0'),price:100000},...prev]);
    log(`Produit ${name} ajouté`);
    toast('Produit ajouté.');
  }

  const filtered=invoices.filter(i=>(i.id+i.client+i.status).toLowerCase().includes(search.toLowerCase()));
  const title=nav.find(n=>n.id===page)?.label||'Vue d’ensemble';

  if (authLoading) return <div style={{padding:40,textAlign:"center"}}>Vérification de la connexion...</div>;

  if (!user) return (<div style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#f5f6fa",padding:20}}><form onSubmit={handleLogin} style={{background:"#fff",padding:32,borderRadius:16,width:"100%",maxWidth:400}}><h2>Connexion FaktSure</h2><p>Connecte-toi avec tes identifiants administrateur.</p><input type="email" placeholder="Adresse email" value={email} onChange={e=>setEmail(e.target.value)} required style={{width:"100%",padding:13,marginBottom:12,boxSizing:"border-box"}}/><input type="password" placeholder="Mot de passe" value={password} onChange={e=>setPassword(e.target.value)} required style={{width:"100%",padding:13,marginBottom:12,boxSizing:"border-box"}}/>{authError && <p style={{color:"red"}}>{authError}</p>}<button type="submit" style={{width:"100%",padding:14,background:"#143b6f",color:"#fff",border:0,borderRadius:8}}>Se connecter</button></form></div>);

  return <div className="app-shell">
    {mobileOpen && <div className="mobile-overlay" onClick={()=>setMobileOpen(false)} />}
    <aside className={`sidebar ${mobileOpen?'open':''}`}>
      <div className="brand">
        <div className="brand-mark"><FileText size={22}/><span className="brand-check"><Check size={12}/></span></div>
        <div><strong>FaktSure</strong><span>SMART INVOICING</span></div>
        <button className="close-sidebar" onClick={()=>setMobileOpen(false)}><X/></button>
      </div>
      <div className="workspace"><div className="workspace-avatar">F</div><div><b>Workspace Demo</b><small>Équipe facturation</small></div><MoreHorizontal size={18}/></div>
      <div className="nav-caption">MENU PRINCIPAL</div>
      <nav>{nav.map(n=><button key={n.id} onClick={()=>go(n.id)} className={`nav-item ${page===n.id?'active':''}`}><n.icon size={18}/><span>{n.label}</span>{n.id==='documents'&&<span className="nav-count">3</span>}</button>)}</nav>
      <div className="sidebar-bottom">
        <button className="nav-item" onClick={()=>toast('Paramètres : démonstration')}><Settings size={18}/>Paramètres</button>
        <button className="nav-item" onClick={()=>toast('Centre d’aide : démonstration')}><CircleHelp size={18}/>Centre d’aide</button>
        <div className="user-card"><div className="user-avatar">CT</div><div><b>Carin TONOU</b><small>Administrateur</small></div><MoreHorizontal size={18}/></div>
      </div>
    </aside>

    <main className="main">
      <header className="topbar">
        <button className="menu-toggle" onClick={()=>setMobileOpen(true)}><Menu/></button>
        <div className="crumb"><span>Workspace</span><ChevronRight size={14}/><b>{title}</b></div>
        <div className="top-actions">
          <div className="searchbox"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..."/><kbd>⌘ K</kbd></div>
          <button className="icon-btn notification-btn" onClick={()=>toast('Vous êtes à jour')}><Bell size={19}/><span/></button>
          <div className="user-avatar small">CT</div>
        </div>
      </header>

      <div className="content">
        {page==='dashboard'&&<Dashboard invoices={invoices} go={go} setSelectedInvoice={setSelectedInvoice} setShowImport={setShowImport} log={log}/>}
        {page==='documents'&&<Documents setShowImport={setShowImport} files={files} setFiles={setFiles} simulateAnalysis={simulateAnalysis} toast={toast}/>}
        {page==='invoices'&&<Invoices invoices={filtered} setSelectedInvoice={setSelectedInvoice} addInvoice={addInvoice}/>}
        {page==='clients'&&<Clients clients={clients} addClient={addClient} search={search}/>}
        {page==='products'&&<Products products={products} addProduct={addProduct} search={search}/>}
        {page==='journal'&&<Journal journal={journal}/>}
      </div>
    </main>

    {showImport&&<ImportModal onClose={()=>setShowImport(false)} onImport={simulateAnalysis} files={files} setFiles={setFiles}/>}
    {analysisData&&<AnalysisModal data={analysisData} onClose={()=>setAnalysisData(null)} onConfirm={confirmAnalysis}/>}
    {selectedInvoice&&<InvoiceModal invoice={selectedInvoice} onClose={()=>setSelectedInvoice(null)} onValidate={validateInvoice}/>} 
    {notification&&<div className="toast"><CheckCircle2 size={18}/>{notification}</div>}
  </div>;
}

function Dashboard({invoices,go,setSelectedInvoice,setShowImport}){
  const validated=invoices.filter(x=>x.status==='Validée');
  const total=validated.reduce((s,x)=>s+x.amount,0);
  const pending=invoices.filter(x=>x.status==='Brouillon'||x.status==='En revue').length;
  const anomalies=invoices.filter(x=>x.status==='Anomalie').length;
  return <>
    <div className="page-heading"><div><div className="eyebrow">MARDI 25 NOVEMBRE 2026</div><h1>Bonjour, Carin <span className="wave">✦</span></h1><p>Voici ce qui se passe dans votre espace de facturation.</p></div><button className="btn primary" onClick={()=>setShowImport(true)}><Plus size={17}/> Nouvelle facture</button></div>
    <div className="stats-grid">
      <Stat title="Factures validées" value={validated.length.toString()} trend="+12%" note="vs mois dernier" icon={FileCheck2} color="blue"/>
      <Stat title="Montant facturé" value={fmt(total)} trend="+8.4%" note="vs mois dernier" icon={Activity} color="green"/>
      <Stat title="En attente" value={pending.toString()} note="À traiter" icon={Clock} color="orange"/>
      <Stat title="Anomalies" value={anomalies.toString()} note="À vérifier" icon={AlertTriangle} color="red"/>
    </div>
    <div className="dashboard-grid">
      <section className="panel chart-panel"><div className="panel-head"><div><h3>Activité de facturation</h3><p>Évolution des montants · 7 derniers jours</p></div><button className="btn subtle">7 jours ▾</button></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#635bff" stopOpacity=".20"/><stop offset="100%" stopColor="#635bff" stopOpacity="0"/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f4"/><XAxis dataKey="name" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false} tickFormatter={v=>`${v/1000}k`} width={45}/><Tooltip formatter={v=>fmt(v)}/><Area type="monotone" dataKey="value" stroke="#635bff" strokeWidth={2.5} fill="url(#areaColor)" /></AreaChart></ResponsiveContainer></div></section>
      <section className="panel activity-panel"><div className="panel-head"><div><h3>À traiter</h3><p>Documents nécessitant votre attention</p></div><button className="text-btn" onClick={()=>go('documents')}>Tout voir <ChevronRight size={15}/></button></div><div className="task-list"><Task icon={AlertTriangle} color="red" title="Anomalie détectée" text="Kora Distribution · Prix inhabituel"/><Task icon={Clock} color="orange" title="Validation en attente" text="Bénin Digital · Brouillon"/><Task icon={ScanText} color="blue" title="Document à revoir" text="MédiaCom Afrique · Extraction"/></div></section>
    </div>
    <section className="panel table-panel"><div className="panel-head"><div><h3>Factures récentes</h3><p>Derniers documents de votre espace</p></div><button className="text-btn" onClick={()=>go('invoices')}>Toutes les factures <ChevronRight size={15}/></button></div><InvoiceTable invoices={invoices.slice(0,5)} setSelectedInvoice={setSelectedInvoice}/></section>
    <section className="quick-grid"><button className="quick-card" onClick={()=>setShowImport(true)}><div className="quick-icon purple"><FileUp/></div><div><b>Importer un document</b><p>PDF, image ou texte</p></div><ChevronRight/></button><button className="quick-card" onClick={()=>go('clients')}><div className="quick-icon blue"><Users/></div><div><b>Gérer les clients</b><p>Votre répertoire clients</p></div><ChevronRight/></button><button className="quick-card" onClick={()=>go('products')}><div className="quick-icon green"><Package/></div><div><b>Catalogue produits</b><p>Articles et prix de référence</p></div><ChevronRight/></button></section>
  </>;
}

function Stat({title,value,trend,note,icon:Icon,color}){
  return <div className="stat-card"><div className="stat-top"><span>{title}</span><div className={`stat-icon ${color}`}><Icon size={19}/></div></div><div className="stat-value">{value}</div><div className="stat-foot">{trend&&<span className="trend"><ArrowUpRight size={14}/>{trend}</span>}<span>{note}</span></div></div>;
}
function Task({icon:Icon,color,title,text}){return <div className="task"><div className={`task-icon ${color}`}><Icon size={17}/></div><div><b>{title}</b><small>{text}</small></div><ChevronRight size={16}/></div>}

function InvoiceTable({invoices,setSelectedInvoice}){
  return <div className="table-wrap"><table><thead><tr><th>NUMÉRO</th><th>CLIENT</th><th>DATE</th><th>MONTANT</th><th>STATUT</th><th></th></tr></thead><tbody>{invoices.map(i=><tr key={i.id} onClick={()=>setSelectedInvoice(i)} className="click-row"><td><b className="invoice-id">{i.id}</b></td><td>{i.client}</td><td>{i.date}</td><td className="amount">{fmt(i.amount)}</td><td><Status status={i.status}/></td><td><button className="icon-btn"><MoreHorizontal size={18}/></button></td></tr>)}</tbody></table></div>;
}

function Invoices({invoices,setSelectedInvoice,addInvoice}){
  return <><div className="page-heading"><div><div className="eyebrow">GESTION</div><h1>Factures</h1><p>Consultez et gérez vos documents de facturation.</p></div><button className="btn primary" onClick={addInvoice}><Plus size={17}/> Créer une facture</button></div><section className="panel table-panel"><div className="panel-head"><div><h3>Toutes les factures</h3><p>{invoices.length} document(s)</p></div><button className="btn subtle"><Filter size={16}/> Filtrer</button></div><InvoiceTable invoices={invoices} setSelectedInvoice={setSelectedInvoice}/></section></>;
}

function Documents({setShowImport,files,setFiles,simulateAnalysis,toast}){
  return <><div className="page-heading"><div><div className="eyebrow">WORKFLOW</div><h1>Documents</h1><p>Importez vos sources commerciales pour les transformer en factures.</p></div><button className="btn primary" onClick={()=>setShowImport(true)}><Upload size={17}/> Importer</button></div><section className="panel document-panel"><div className="panel-head"><div><h3>Centre de documents</h3><p>Sources et pièces justificatives</p></div><span className="badge gray">Démo</span></div><div className="dropzone" onClick={()=>setShowImport(true)}><div className="drop-icon"><FileUp size={26}/></div><h3>Déposez vos documents ici</h3><p>PDF, JPG, PNG ou texte · Cliquez pour importer</p><button className="btn subtle">Choisir un fichier</button></div><div className="process-steps"><div className="process-step active"><span>1</span><b>Import</b></div><div className="step-line"/><div className="process-step"><span>2</span><b>Extraction</b></div><div className="step-line"/><div className="process-step"><span>3</span><b>Revue</b></div><div className="step-line"/><div className="process-step"><span>4</span><b>Facture</b></div></div>{files.length>0&&<div className="uploaded-list">{files.map((f,i)=><div className="uploaded" key={i}><FileText size={18}/><div><b>{f.name}</b><small>Prêt à analyser</small></div><button className="btn primary" onClick={simulateAnalysis}>Analyser</button></div>)}</div>}<div className="empty-doc"><ScanText size={34}/><h3>Aucun document analysé</h3><p>Vos documents apparaîtront ici une fois importés.</p></div></section></>;
}

function Clients({clients,addClient,search}){
  const list=clients.filter(c=>(c.name+c.email).toLowerCase().includes(search.toLowerCase()));
  return <><div className="page-heading"><div><div className="eyebrow">RÉFÉRENTIEL</div><h1>Clients</h1><p>Gérez votre répertoire de clients.</p></div><button className="btn primary" onClick={addClient}><Plus size={17}/> Ajouter un client</button></div><section className="panel table-panel"><div className="panel-head"><div><h3>Répertoire clients</h3><p>{list.length} client(s)</p></div></div><div className="table-wrap"><table><thead><tr><th>CLIENT</th><th>EMAIL</th><th>TYPE</th><th></th></tr></thead><tbody>{list.map((c,i)=><tr key={i}><td><div className="client-cell"><div className="client-avatar">{c.name.slice(0,1)}</div><b>{c.name}</b></div></td><td>{c.email}</td><td><span className="badge gray">{c.type}</span></td><td><MoreHorizontal/></td></tr>)}</tbody></table></div></section></>;
}

function Products({products,addProduct,search}){
  const list=products.filter(p=>(p.name+p.ref).toLowerCase().includes(search.toLowerCase()));
  return <><div className="page-heading"><div><div className="eyebrow">RÉFÉRENTIEL</div><h1>Catalogue</h1><p>Produits, prestations et prix de référence.</p></div><button className="btn primary" onClick={addProduct}><Plus size={17}/> Ajouter un produit</button></div><section className="panel table-panel"><div className="panel-head"><div><h3>Catalogue produits</h3><p>{list.length} article(s)</p></div></div><div className="table-wrap"><table><thead><tr><th>RÉFÉRENCE</th><th>ARTICLE</th><th>PRIX UNITAIRE</th><th></th></tr></thead><tbody>{list.map((p,i)=><tr key={i}><td><span className="invoice-id">{p.ref}</span></td><td><b>{p.name}</b></td><td className="amount">{fmt(p.price)}</td><td><MoreHorizontal/></td></tr>)}</tbody></table></div></section></>;
}

function Journal({journal}){
  return <><div className="page-heading"><div><div className="eyebrow">TRAÇABILITÉ</div><h1>Journal d’activité</h1><p>Historique des actions dans l'espace de démonstration.</p></div></div><section className="panel journal-panel"><div className="panel-head"><div><h3>Activité récente</h3><p>{journal.length} événement(s)</p></div></div>{journal.map((j,i)=><div className="journal-entry" key={i}><div className="journal-icon"><History size={18}/></div><div><b>{j.action}</b><small>{j.time}</small></div></div>)}</section></>;
}

function ImportModal({onClose,onImport,files,setFiles}){
  const [text,setText]=useState('');
  function handleFiles(e){
    setFiles(Array.from(e.target.files||[]));
  }
  return <div className="modal-backdrop" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><h2>Importer une source</h2><p>Ajoutez un document ou collez un message.</p></div><button className="icon-btn" onClick={onClose}><X/></button></div><label className="file-drop"><FileUp size={30}/><b>Choisir des fichiers</b><span>PDF, PNG, JPG · Plusieurs fichiers acceptés</span><input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" onChange={handleFiles}/></label>{files.length>0&&<div className="selected-files">{files.map((f,i)=><div key={i}><FileText size={17}/>{f.name}</div>)}</div>}<div className="form-label">Ou collez un message / contenu commercial</div><textarea className="text-input" rows="4" value={text} onChange={e=>setText(e.target.value)} placeholder="Ex. Commande de NovaTech : 2 ordinateurs à 450 000 FCFA chacun..."/><div className="modal-actions"><button className="btn subtle" onClick={onClose}>Annuler</button><button className="btn primary" onClick={()=>{if(text.trim()&&!files.length)setFiles([{name:'Message texte',text}]);onImport();}}>Analyser la source <Sparkles size={16}/></button></div></div></div>;
}

function InvoiceModal({invoice,onClose,onValidate}){
  const [edit,setEdit]=useState(false);
  const [client,setClient]=useState(invoice.client);
  const [amount,setAmount]=useState(invoice.amount);
  return <div className="modal-backdrop" onClick={onClose}><div className="modal invoice-modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">DOCUMENT</div><h2>{invoice.id}</h2><p>Vérifiez les informations avant validation.</p></div><button className="icon-btn" onClick={onClose}><X/></button></div><div className="review-banner"><Sparkles size={18}/><div><b>Extraction simulée</b><small>Les informations sont modifiables.</small></div><span className="badge green">95% confiance</span></div><div className="review-form"><label>Client<input value={client} onChange={e=>setClient(e.target.value)} disabled={!edit}/></label><label>Date<input defaultValue={invoice.date} disabled={!edit}/></label><label>Montant total (FCFA)<input type="number" value={amount} onChange={e=>setAmount(Number(e.target.value))} disabled={!edit}/></label><label>Statut<select defaultValue={invoice.status}><option>Brouillon</option><option>En revue</option><option>Anomalie</option><option>Validée</option></select></label></div><div className="invoice-preview"><div className="invoice-brand">FaktSure <small>FACTURE</small></div><div className="invoice-line"><span>Client</span><b>{client}</b></div><div className="invoice-line"><span>Référence</span><b>{invoice.id}</b></div><div className="invoice-total"><span>Total TTC</span><b>{fmt(Number(amount))}</b></div></div><div className="modal-actions"><button className="btn subtle" onClick={()=>setEdit(!edit)}>{edit?'Terminer la modification':'Modifier'}</button><button className="btn primary" onClick={()=>onValidate({...invoice,client,amount,status:'Validée'})}><Check size={17}/> Valider la facture</button></div></div></div>;
}


function AnalysisModal({data,onClose,onConfirm}){
  const [form,setForm] = useState({...data});
  const update=(key,value)=>setForm(prev=>({...prev,[key]:value}));
  const subtotal=Number(form.quantity||0)*Number(form.unitPrice||0);
  const total=Math.round(subtotal*(1+Number(form.vat||0)/100));
  const fmtLocal=n=>new Intl.NumberFormat('fr-FR').format(n)+' FCFA';

  return <div className="modal-backdrop" onClick={onClose}>
    <div className="modal invoice-modal" onClick={e=>e.stopPropagation()}>
      <div className="modal-head">
        <div><div className="eyebrow">ÉTAPE 2 · VÉRIFICATION</div><h2>Vérifier les données extraites</h2><p>Extraction simulée — vérifie et corrige les informations.</p></div>
        <button className="icon-btn" onClick={onClose}><X/></button>
      </div>
      <div className="review-banner"><Sparkles size={18}/><div><b>Extraction simulée</b><small>Les données ci-dessous sont fictives.</small></div><span className="badge orange">À vérifier</span></div>
      <div className="form-label">Source : {form.source}</div>
      <div className="review-form">
        <label>Fournisseur<input value={form.supplier} onChange={e=>update('supplier',e.target.value)}/></label>
        <label>Client<input value={form.client} onChange={e=>update('client',e.target.value)}/></label>
        <label>Date<input value={form.date} onChange={e=>update('date',e.target.value)}/></label>
        <label>Désignation<input value={form.description} onChange={e=>update('description',e.target.value)}/></label>
        <label>Quantité<input type="number" min="1" value={form.quantity} onChange={e=>update('quantity',Number(e.target.value))}/></label>
        <label>Prix unitaire (FCFA)<input type="number" min="0" value={form.unitPrice} onChange={e=>update('unitPrice',Number(e.target.value))}/></label>
        <label>TVA (%)<input type="number" min="0" value={form.vat} onChange={e=>update('vat',Number(e.target.value))}/></label>
      </div>
      <div className="invoice-preview">
        <div className="invoice-brand">FaktSure <small>APERÇU DES MONTANTS</small></div>
        <div className="invoice-line"><span>Sous-total HT</span><b>{fmtLocal(subtotal)}</b></div>
        <div className="invoice-line"><span>TVA ({form.vat}%)</span><b>{fmtLocal(subtotal*Number(form.vat||0)/100)}</b></div>
        <div className="invoice-total"><span>Total TTC</span><b>{fmtLocal(total)}</b></div>
      </div>
      <div className="modal-actions">
        <button className="btn subtle" onClick={onClose}>Annuler</button>
        <button className="btn primary" onClick={()=>onConfirm(form)}><Check size={17}/> Créer le brouillon</button>
      </div>
    </div>
  </div>;
}

export default App;
