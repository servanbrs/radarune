export default function Metadata(){

return(

<div>

<h2 className="text-3xl font-bold">
Metadata
</h2>

<div className="mt-10 grid gap-6">

<input
placeholder="Şarkı Adı"
className="rounded-2xl bg-white/5 p-5 outline-none"
/>

<input
placeholder="Sanatçı"
className="rounded-2xl bg-white/5 p-5 outline-none"
/>

<select
className="rounded-2xl bg-white/5 p-5">

<option>
Deep House
</option>

<option>
Pop
</option>

<option>
Rap
</option>

</select>

<textarea
placeholder="Açıklama"
className="h-40 rounded-2xl bg-white/5 p-5"
/>

<button
className="rounded-full bg-violet-600 py-5 text-lg">

AI Review Başlat

</button>

</div>

</div>

)

}