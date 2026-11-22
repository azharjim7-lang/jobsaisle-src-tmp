function slugify(s){return String(s==null?'':s).toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);}
export function jobUrl(j){
  if(!j||(j.id==null&&!j.slug))return '/';
  const id=(j.id!=null)?j.id:j.slug;
  const parts=[];
  if(j.title)parts.push(slugify(j.title));
  if(j.minExperience)parts.push(slugify(String(j.minExperience)+'-years'));
  if(j.salaryMin){const cur=j.salaryCurrency?String(j.salaryCurrency).toLowerCase():'';parts.push(slugify((cur?cur+'-':'')+j.salaryMin));}
  if(j.city)parts.push(slugify(j.city));
  const tail=parts.filter(Boolean).join('-');
  return '/job-listings-'+(tail?tail+'-':'')+id;
}
