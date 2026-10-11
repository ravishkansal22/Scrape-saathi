import {test,expect} from '@playwright/test';
test('browser handover, deductions and two-party payment',async({page,request})=>{
 const title='Browser handover QA '+Date.now();
 const login=await request.post('/api/v2/login',{data:{user:'collector_demo',password:'scrapsetu-local'}});
 const token=(await login.json()).access_token;
 const post=async(path:string,data:unknown)=>{const r=await request.post('/api/v2'+path,{data,headers:{Authorization:'Bearer '+token,'Idempotency-Key':crypto.randomUUID()}});expect(r.ok(),await r.text()).toBeTruthy();return r.json();};
 const analysis=await post('/analyze',{sample_item_id:'electric_motor'});
 const lot=await post('/lots',{title,material_id:'copper',weight_kg:10,analysis_id:analysis.id});
 async function signIn(role:string){await page.goto('/');await page.getByLabel('Account').selectOption(role+'_demo');await page.getByRole('button',{name:'Sign in locally'}).click();await expect(page.getByRole('button',{name:'Sign out'})).toBeVisible();}
 async function switchRole(role:string){await page.getByRole('button',{name:'Sign out'}).click();await signIn(role);await page.getByRole('button',{name:'Handovers',exact:true}).click();}
 await signIn('collector');await page.getByRole('button',{name:'Lots',exact:true}).click();await page.getByText(title,{exact:true}).click();
 await page.getByLabel('Buyer',{exact:true}).selectOption('recycler_demo');await page.getByRole('button',{name:'Create handover offer'}).click();
 await expect(page.getByLabel('Share with the named receiver')).toBeVisible();const qr=await page.getByLabel('Share with the named receiver').inputValue();
 await switchRole('recycler');await page.getByLabel('Handover token',{exact:true}).fill(qr);await page.getByLabel('Contamination deduction kg').fill('1');await page.getByRole('button',{name:'Submit measured receipt'}).click();await expect(page.getByText('Measurements proposed; sender must accept',{exact:false})).toBeVisible();
 await switchRole('collector');await page.getByRole('button',{name:'Accept final weight & ₹900',exact:true}).click();await expect(page.getByText('Handover accepted',{exact:false})).toBeVisible();
 await switchRole('recycler');const transaction=page.locator('.wf-transaction').filter({hasText:lot.id});await transaction.getByText('Report a payment',{exact:true}).click();await transaction.getByLabel('Payment reference / cash receipt').fill('Browser QA cash');await transaction.getByRole('button',{name:'Report payment',exact:true}).click();await expect(page.getByText('Payment reported; seller must confirm',{exact:false})).toBeVisible();
 await switchRole('collector');await page.getByRole('button',{name:'I received ₹900',exact:true}).click();await expect(page.getByText('Payment acknowledged',{exact:false})).toBeVisible();await expect(page.locator('.wf-transaction').filter({hasText:lot.id}).getByText('PAID',{exact:true})).toBeVisible();
});
