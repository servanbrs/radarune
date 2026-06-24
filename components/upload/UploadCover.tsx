"use client";

export default function UploadCover({
next,
}:{
next:()=>void
}){

return(

<div>

<h2 className="text-3xl font-bold">
Kapak Görseli
</h2>

<div className="mt-8 rounded-3xl border-2 border-dashed border-violet-500/30 p-20 text-center">

<p>
3000 x 3000 PNG/JPG
</p>

</div>

<button
onClick={next}
className="mt-10 rounded-full bg-violet-600 px-8 py-4"
>

Devam

</button>

</div>

)

}