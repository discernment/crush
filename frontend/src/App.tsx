import { useEffect, useState } from "react";
import "./App.css";
import { Alert, Box, Button, Grid, List, ListItem, ListItemText, Tab, TextField } from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { v4 as uuidv4 } from "uuid";
import { CrushLabel, isValidUPC } from "./label";

function App() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [value, setValue] = useState("checkout");
  const [mfgUpc, setMfgUpc] = useState("");
  const [labels, setLabels] = useState<Array<string>>([])
  const [checkoutLabel,setCheckoutLabel] = useState("");
  const [checkoutUpc,setCheckoutUpc] = useState("");
  const [checkoutStatus,setCheckoutStatus] = useState("");
  const [statusLabel,setStatusLabel]=useState("");
  const [statusUpc,setStatusUpc]=useState("");
  const [statusStatus, setStatusStatus]=useState("");
  const [redeemLabel,setRedeemLabel]=useState("");
  const [redeemStatus, setRedeemStatus]=useState("");

  useEffect(()=>{
    generateLabels();
  },[mfgUpc,value]);

  function generateLabels(){
    if (isValidUPC(mfgUpc)){
      const newLabels:string[]=[];
      for (let i=1;i<=30;i++){
        newLabels.push(CrushLabel.fromDetails(uuidv4(),mfgUpc).labelString);
      }
      setLabels(newLabels);
    } else {
      setLabels([]);
    }
  }

  useEffect(()=>{
    try {
      const label=CrushLabel.fromLabelString(checkoutLabel);
      setCheckoutUpc(label.upcString);
    } catch {
      setCheckoutUpc("");
    }
    setCheckoutStatus("");
    setErrorMsg("");
  },[checkoutLabel])

  useEffect(()=>{
    try {
      const label=CrushLabel.fromLabelString(statusLabel);
      setStatusUpc(label.upcString);
    } catch {
      setStatusUpc("");
    }
    setStatusStatus("");
    setErrorMsg("");
  },[statusLabel])


  async function mint() {
    setLoading(true);
    setErrorMsg("");
    setCheckoutStatus("");
    try {
      const res = await fetch(`/api/label`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: checkoutLabel,
        }),
      });
      const { _, error } = await res.json();
      if (!res.ok) {
        if (res.status===409){
          setErrorMsg("Deposit already exists")
        }else {
          setErrorMsg(error);
        }
      } else {
        setCheckoutStatus("Deposit Committed");
      }
    } catch (err: any) {
      setErrorMsg(err.stack);
    }
    setLoading(false);
  }

  async function checkStatus() {
    setLoading(true);
    setErrorMsg("");
    setCheckoutStatus("");
    try {
      const res = await fetch(`/api/label/${statusLabel}`);
      if (!res.ok) {
        const {error} = await res.json();
        setErrorMsg(error);
      } else {
        const data = await res.json();
        setStatusStatus(data.status);
      }
    } catch (err: any) {
      setErrorMsg(err.stack);
    }
    setLoading(false);
  }

  async function redeem() {
    setLoading(true);
    setErrorMsg("");
    setRedeemStatus("");
    try {
      const res = await fetch(`/api/label/${redeemLabel}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "REDEEMED",
        }),
      });
      const { _, error } = await res.json();
      if (!res.ok) {
        if (res.status===400){
          setErrorMsg("No Deposit")
        }
        else if (res.status===409){
          setErrorMsg("Already Redeemed")
        } else{
          setErrorMsg(error);
        }
      } else {
        setRedeemStatus("Deposit Redeemed");
      }
    } catch (err: any) {
      console.log("err",err)
      if (err.status===400){
        setErrorMsg("No Deposit")
      } else {
        setErrorMsg(err.stack);
      }
    }
    setLoading(false);
  }
  
  function onTabChange(tabId:string){
    setValue(tabId);
    setErrorMsg("");
  }

  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <TabContext value={value}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <TabList onChange={(_,val)=>onTabChange(val)}>
        <Tab label="Manufacture" value="manufacture" />
        <Tab label="Checkout" value="checkout"/>
        <Tab label="Status" value="status" />
        <Tab label="Empties" value="empties" />
        </TabList>
        </Box>
      <TabPanel value="manufacture">
        <TextField label="UPC" value={mfgUpc} onChange={e=>setMfgUpc(e.target.value)} />
        <List>
          { labels.length>0 && <Button onClick={_=>generateLabels()}>Regenerate</Button> }
          {labels.map(item=>(
            <ListItem><ListItemText>{item}</ListItemText></ListItem>
          ))}
        </List>
      </TabPanel>

      <TabPanel value="checkout">
        <Grid container direction="column" spacing={2}>
          <Grid item xs={12}>
            <TextField label="Label" value={checkoutLabel} onChange={e=>setCheckoutLabel(e.target.value)} fullWidth/>
          </Grid>
          {checkoutUpc!=="000000000000"  && statusUpc!=="" && <>
            <Grid item xs={12}>
              <TextField label="UPC" value={checkoutUpc} disabled/>
            </Grid>
            <Grid item xs={12}>
              <Button onClick={_=>mint()} disabled={loading || checkoutStatus!==""}>Pay Deposit</Button>
            </Grid>
            <Grid item xs={12}>
            {checkoutStatus!=="" && <Alert severity="success">{checkoutStatus}</Alert>}
            </Grid>
          </>}
        </Grid>
      </TabPanel>

      <TabPanel value="status">
        <Grid container direction="column" spacing={2}>
          <Grid item xs={12}>
            <TextField label="Label" value={statusLabel} onChange={e=>setStatusLabel(e.target.value)} fullWidth/>
          </Grid>
          {statusUpc!=="000000000000" && statusUpc!=="" && <>
          <Grid item xs={12}>
            <TextField label="UPC" value={statusUpc} disabled/>
          </Grid>
          <Grid item xs={12}>
            <Button onClick={_=>checkStatus()}>Check Status</Button>
          </Grid>
          <Grid item xs={12}>
            {statusStatus!=="" && <TextField label="Status" value={statusStatus} disabled />}
          </Grid>
          </>}
        </Grid>
      </TabPanel>

      <TabPanel value="empties">
        <Grid container direction="column" spacing={2}>
          <Grid item xs={12}>
            <TextField label="Label" value={redeemLabel} onChange={e=>setRedeemLabel(e.target.value)} fullWidth/>
          </Grid>
          <Grid item xs={12}>
            <Button onClick={_=>redeem()}>Redeem Deposit</Button>
          </Grid>
          <Grid item xs={12}>
            {redeemStatus!=="" && <Alert severity="success">{redeemStatus}</Alert>}
          </Grid>
        </Grid>
      </TabPanel>

      </TabContext>
      {errorMsg!=="" && <Alert severity="error">{errorMsg}</Alert>}
    </Box>
  );
}

export default App;
