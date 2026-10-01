(() => {
  'use strict';
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#site-nav');
  const mobile = matchMedia('(max-width:800px)');
  function closeMenu(){ nav?.classList.toggle('is-collapsed',mobile.matches); menu?.setAttribute('aria-expanded','false'); }
  closeMenu(); mobile.addEventListener('change',closeMenu);
  menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-collapsed',!open);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape' && menu?.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus();}});

  document.addEventListener('click',e=>{const a=e.target.closest('a');if(!a)return;const href=a.getAttribute('href')||'';const type=href.startsWith('/contact')?'contact_click':href.startsWith('/demo')?'demo_click':href.startsWith('mailto:')?'email_click':null;if(type){try{if(window.gtag)gtag('event',type,{page_path:location.pathname});}catch{}}});
  const form=document.querySelector('form#contact-form');
  if(form){
    const query=new URLSearchParams(location.search);
    const intent=query.get('intent');
    if(['walkthrough','proposal','question'].includes(intent))form.elements.intent.value=intent;
    form.elements.source_page.value=(query.get('source')||'contact').slice(0,100);
    const interest=query.get('interest');
    if(interest)form.elements.notes.value='I’d like help with '+interest.slice(0,100)+'.';
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      if(!form.reportValidity())return;
      const button=form.querySelector('[type=submit]'),status=document.querySelector('#form-status');
      button.disabled=true;button.textContent='Sending…';status.textContent='';
      try{
        const response=await fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(new FormData(form)).toString(),signal:AbortSignal.timeout(20000)});
        if(!response.ok)throw new Error('Submission failed');
        try{sessionStorage.setItem('gt-request-sent','1');}catch{}
        try{if(window.gtag)gtag('event','generate_lead',{form:'contact',request_type:form.elements.intent.value});}catch{}
        location.assign('/thanks?sent=1');
      }catch(error){
        status.replaceChildren(document.createTextNode(error.name==='TimeoutError'?'We couldn’t confirm that your request arrived. Please email Alex to check: ':'Your request could not be confirmed. Please try again or email Alex: '));
        const email=document.createElement('a');email.href='mailto:alex@goodtroubleglobal.com';email.textContent='alex@goodtroubleglobal.com';status.append(email);
        button.disabled=false;button.textContent='Send my request ↗';
      }
    });
  }
  const receipt=document.querySelector('#receipt-copy');
  if(receipt){try{if(sessionStorage.getItem('gt-request-sent')==='1'){receipt.textContent='Your request has been sent. Alex or Augie will reply by email within one business day to arrange a conversation about your spa.';sessionStorage.removeItem('gt-request-sent');}}catch{}}

  const conversation=document.querySelector('#tour-conversation');
  if(conversation){
    const stages=[
      {messages:[['client','What’s included in your Signature Facial?'],['assistant','A cleanse, gentle exfoliation, and a hydrating mask. It’s 45 minutes, for $150. What would you like to know?'],['client','Anything extra for hydration? Can I come after work?'],['assistant','You can add a 10-minute Hydrating Finish for $30, making the total $180. The $150 facial is also available on its own. Which day works for you?']],benefit:'A new client gets help while she’s interested. Your team doesn’t have to stop what they’re doing.',next:'Next: the follow-up →'},
      {messages:[['client','Monday might work. Can you check with me tomorrow?'],['assistant','Of course. I’ll check back tomorrow afternoon.'],['client','The next afternoon…'],['assistant','Hi Maya! Following up as you asked. Monday at 4:30 is available for the facial and Hydrating Finish: 55 minutes, $180 total. Would you like that spot?']],benefit:'The follow-up happens when Maya asked for it. Her question doesn’t disappear into a busy inbox.',next:'Next: the booking →'},
      {messages:[['client','Yes, Monday at 4:30 works!'],['assistant','Great. Here’s your booking link. Review the details and confirm there.']],benefit:'Maya has booked. Your team can see the conversation and the appointment together.',next:'Replay the example ↻',booking:true}
    ];
    let stage=0;
    function render(){
      const current=stages[stage];conversation.replaceChildren();
      current.messages.forEach(([role,text])=>{const bubble=document.createElement('div');bubble.className='bubble '+role;bubble.textContent=text;conversation.append(bubble);});
      if(current.booking){const result=document.createElement('div');result.className='booking-result';result.innerHTML='<b>✓ Appointment confirmed</b><p>Maya · Monday · 4:30 PM<br>Facial + Hydrating Finish · 55 minutes · $180</p><p>Sample booking. No payment collected.</p>';conversation.append(result);}
      document.querySelector('#tour-benefit').textContent=current.benefit;
      document.querySelector('#tour-count').textContent=(stage+1)+' / 3';
      document.querySelector('#tour-next').textContent=current.next;
      document.querySelectorAll('[data-tour]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.tour)===stage)));
    }
    render();
    document.querySelectorAll('[data-tour]').forEach(b=>b.addEventListener('click',()=>{stage=Number(b.dataset.tour);render();if(mobile.matches)conversation.scrollIntoView({block:'center',behavior:'auto'});}));
    document.querySelector('#tour-next').addEventListener('click',()=>{stage=(stage+1)%3;render();if(mobile.matches)conversation.scrollIntoView({block:'center',behavior:'auto'});});
  }
})();
