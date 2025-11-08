import React,
{useEffect,useState} from 'react';

const API=(path,opts={}) => fetch(`http://localhost:8080${path}`,
    {headers:{'Content-Type':'application/json'},
    ...opts,body:opts.body?JSON.stringify(opts.body):undefined}).then(r=>r.json()
);
    
export default function App(){
    const [status,setStatus]=useState(null);
    const [result,setResult]=useState(null);

    useEffect(()=>{
        API('/api/status').then(setStatus)
        },[]
    );

    return(
        <div style={{fontFamily:'Inter, system-ui, Arial',padding:24}}>
            <h1>AIME Admin Dashboard (React)</h1>

            <section>
                <h3>Backend Status</h3>
                <pre>{JSON.stringify(status,null,2)}</pre>
            </section>

            <section>
                <h3>Run Core Engine Smoke Test</h3>
                <button onClick={async()=>setResult(await API('/api/smoke/core',{method:'POST',body:{}}))}>Run</button>
                <pre>{result?JSON.stringify(result,null,2):'No result yet'}</pre>
            </section>
            
            <section>
                <h3>Simulate Signal Event (requires FEATURE_SIGNAL_NETWORK=true)</h3>
                <button onClick={async()=>setResult(await API('/api/signal/simulate',{method:'POST',body:{keyword:'demo'}}))}>Simulate</button>
            </section>
        
        </div>
    )
}
