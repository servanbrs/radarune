"use client";

export default function UploadAudio({
  next,
}:{
  next:()=>void
}){

return(

<div>

<h2 className="text-3xl font-bold">
Ses Dosyası
</h2>

<div className="mt-8 rounded-3xl border-2 border-dashed border-violet-500/30 p-20 text-center">

<p className="text-xl">
WAV Dosyanı Buraya Sürükle
</p>

<p className="mt-3 text-zinc-500">
24Bit • 44.1kHz
</p>

</div>

<button
onClick={next}
className="mt-10 rounded-full bg-violet-600 px-8 py-4"
>

Devam Et

</button>

</div>

)

}