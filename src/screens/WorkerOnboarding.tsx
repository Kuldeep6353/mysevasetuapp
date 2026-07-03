import { useRef, useState } from 'react';
import { Icon } from '../components/Icons';
import { Header } from '../components/ui';
import { useToast } from '../components/Toast';
import { supabase, SKILLS, type Worker } from '../lib/supabase';
import type { Lang } from '../lib/i18n';

export function WorkerOnboarding({ lang: _lang, onDone }: { lang: Lang; onDone: (w: Worker) => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [radius, setRadius] = useState<number>(5);
  const [womenSafety, setWomenSafety] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const toggleSkill = (s: string) =>
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const canSubmit =
    name.trim().length >= 2 && /^\d{10}$/.test(phone) && photo !== null && skills.length > 0;

  const submit = async () => {
    if (!canSubmit) return;
    setStep(2);
  };

  const verifyOtp = async (otp: string) => {
    // demo: accept any 4-digit code
    void otp;
    setSubmitting(true);
    // get location (best effort, non-blocking)
    let lat: number | null = null, lng: number | null = null;
    try {
      const pos = await Promise.race([
        new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 })),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 3500)),
      ]);
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch { /* ignore */ }

    const { data, error } = await supabase
      .from('workers')
      .insert({
        name: name.trim(),
        phone,
        photo_url: photo,
        skills,
        work_radius_km: radius,
        women_safety: womenSafety,
        bharosa_score: 50,
        status: 'available',
        lat,
        lng,
        is_seed: false,
      })
      .select()
      .single();

    if (error || !data) {
      setSubmitting(false);
      toast('Profile save nahi hua. Phir se try karein.', 'error');
      return;
    }

    await supabase.from('activity').insert({
      event_type: 'worker_checkin',
      actor_name: name.trim(),
      detail: `checked in as ${skills.join(', ')}`,
      photo_url: photo,
    });

    toast('Profile ban gaya! Aap available hain.', 'success');
    setSubmitting(false);
    onDone(data as Worker);
  };

  return (
    <div className="min-h-screen">
      <Header title={step === 1 ? 'Worker Profile' : 'OTP Verify'} onBack={step === 1 ? undefined : () => setStep(1)} />
      {step === 1 ? (
        <FormStep
          name={name} setName={setName}
          phone={phone} setPhone={setPhone}
          photo={photo} setPhoto={setPhoto}
          skills={skills} toggleSkill={toggleSkill}
          radius={radius} setRadius={setRadius}
          womenSafety={womenSafety} setWomenSafety={setWomenSafety}
          canSubmit={canSubmit}
          onSubmit={submit}
        />
      ) : (
        <OtpStep phone={phone} onVerify={verifyOtp} submitting={submitting} />
      )}
    </div>
  );
}

function FormStep(props: {
  name: string; setName: (s: string) => void;
  phone: string; setPhone: (s: string) => void;
  photo: string | null; setPhoto: (s: string | null) => void;
  skills: string[]; toggleSkill: (s: string) => void;
  radius: number; setRadius: (n: number) => void;
  womenSafety: boolean; setWomenSafety: (b: boolean) => void;
  canSubmit: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="px-5 py-5 max-w-md mx-auto fade-in">
      <PhotoCapture photo={props.photo} setPhoto={props.setPhoto} />

      <div className="mt-5 space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block" style={{ color: '#0B1957' }}>Naam</label>
          <input
            className="input"
            placeholder="Aapka pura naam"
            value={props.name}
            onChange={(e) => props.setName(e.target.value)}
            maxLength={40}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block" style={{ color: '#0B1957' }}>Phone number</label>
          <div className="flex items-center gap-2">
            <span className="input w-16 text-center font-semibold flex-shrink-0" style={{ background: 'rgba(11,25,87,0.04)' }}>+91</span>
            <input
              className="input flex-1"
              type="tel"
              inputMode="numeric"
              placeholder="10 digit number"
              value={props.phone}
              onChange={(e) => props.setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block" style={{ color: '#0B1957' }}>Skill chunein</label>
          <div className="flex flex-wrap gap-2">
            {SKILLS.map((s) => (
              <button
                key={s}
                onClick={() => props.toggleSkill(s)}
                className={`chip ${props.skills.includes(s) ? 'chip-active' : ''}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block" style={{ color: '#0B1957' }}>Kaam kitni door tak?</label>
          <div className="flex flex-wrap gap-2">
            {[2, 5, 10, 999].map((r) => (
              <button
                key={r}
                onClick={() => props.setRadius(r)}
                className={`chip ${props.radius === r ? 'chip-active' : ''}`}
              >
                {r === 999 ? 'Anywhere' : `${r}km`}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => props.setWomenSafety(!props.womenSafety)}
          className="card-sand w-full flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
          style={props.womenSafety ? { background: 'rgba(216,90,48,0.1)', borderColor: '#D85A30' } : {}}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: props.womenSafety ? '#D85A30' : 'rgba(11,25,87,0.08)', color: props.womenSafety ? '#fff' : '#0B1957' }}
          >
            <Icon.Shield size={20} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ color: '#0B1957' }}>Main mahila hu — Suraksha features chahiye</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(11,25,87,0.5)' }}>SOS button + safety monitoring</p>
          </div>
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ background: props.womenSafety ? '#1D9E75' : 'transparent', border: props.womenSafety ? 'none' : '1.5px solid rgba(11,25,87,0.2)' }}
          >
            {props.womenSafety && <Icon.Check size={14} className="text-white" />}
          </div>
        </button>
      </div>

      <button
        onClick={props.onSubmit}
        disabled={!props.canSubmit}
        className="btn-primary w-full mt-6 text-base disabled:opacity-40 disabled:active:scale-100"
      >
        Aage badho
        <Icon.ArrowRight size={20} />
      </button>
    </div>
  );
}

function PhotoCapture({ photo, setPhoto }: { photo: string | null; setPhoto: (s: string | null) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setCameraError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      setCameraError(true);
      fileRef.current?.click();
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const vw = video.videoWidth, vh = video.videoHeight;
    const size = Math.min(vw, vh);
    ctx.drawImage(video, (vw - size) / 2, (vh - size) / 2, size, size, 0, 0, 320, 320);
    setPhoto(canvas.toDataURL('image/jpeg', 0.7));
    stopCamera();
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center">
      <label className="text-sm font-medium mb-2 self-start" style={{ color: '#0B1957' }}>Apni photo lein (selfie)</label>
      {photo ? (
        <div className="relative">
          <img src={photo} alt="selfie" className="w-28 h-28 rounded-2xl object-cover" style={{ border: '2px solid #1D9E75' }} />
          <button
            onClick={() => setPhoto(null)}
            className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-white"
            style={{ background: '#D85A30' }}
          >
            <Icon.X size={16} />
          </button>
        </div>
      ) : cameraOn ? (
        <div className="relative w-28 h-28 rounded-2xl overflow-hidden" style={{ background: '#000' }}>
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          <button
            onClick={capture}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full border-4 border-white"
            style={{ background: 'rgba(255,255,255,0.3)' }}
          />
          <button onClick={stopCamera} className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <Icon.X size={16} />
          </button>
        </div>
      ) : (
        <button
          onClick={startCamera}
          className="w-28 h-28 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
          style={{ background: '#fff', border: '2px dashed rgba(11,25,87,0.2)', color: 'rgba(11,25,87,0.5)' }}
        >
          <Icon.Camera size={28} />
          <span className="text-xs font-medium">Photo lein</span>
        </button>
      )}
      {cameraError && (
        <p className="text-xs mt-2 text-center" style={{ color: 'rgba(11,25,87,0.5)' }}>
          Camera nahi mila. Niche se upload karein.
        </p>
      )}
      <input ref={fileRef} type="file" accept="image/*" capture="user" onChange={onFile} className="hidden" />
      {!photo && !cameraOn && (
        <button onClick={() => fileRef.current?.click()} className="btn-ghost text-xs mt-2">
          <Icon.Upload size={14} />
          Gallery se upload
        </button>
      )}
    </div>
  );
}

function OtpStep({ phone, onVerify, submitting }: { phone: string; onVerify: (otp: string) => void; submitting: boolean }) {
  const [otp, setOtp] = useState(['', '', '', '']);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...otp];
    next[i] = v;
    setOtp(next);
    if (v && i < 3) refs.current[i + 1]?.focus();
    if (next.every((d) => d) && next.join('').length === 4) {
      onVerify(next.join(''));
    }
  };

  return (
    <div className="px-5 py-8 max-w-md mx-auto fade-in flex flex-col items-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'rgba(29,158,117,0.12)' }}
      >
        <Icon.Lock size={30} style={{ color: '#1D9E75' }} />
      </div>
      <h2 className="font-display font-bold text-xl mb-1.5 text-center" style={{ color: '#0B1957' }}>
        OTP verify karein
      </h2>
      <p className="text-sm text-center mb-1" style={{ color: 'rgba(11,25,87,0.5)' }}>
        +91 {phone} par 4-digit code bheja gaya
      </p>
      <p className="text-xs text-center mb-8 max-w-xs" style={{ color: 'rgba(11,25,87,0.4)' }}>
        Yeh aapka profile aaj pura din server par lock kar dega. Page refresh hone par bhi data safe rahega.
      </p>

      <div className="flex gap-3 mb-8">
        {otp.map((d, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            className="input text-center font-display font-bold text-2xl w-14 h-14"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus();
            }}
            autoFocus={i === 0}
          />
        ))}
      </div>

      <button
        onClick={() => otp.every((d) => d) && onVerify(otp.join(''))}
        disabled={!otp.every((d) => d) || submitting}
        className="btn-primary w-full text-base disabled:opacity-40"
      >
        {submitting ? (
          <>
            <Icon.RefreshCw size={20} className="animate-spin" />
            Profile ban raha hai...
          </>
        ) : (
          <>
            Verify &amp; shuru karein
            <Icon.Check size={20} />
          </>
        )}
      </button>

      <p className="text-xs mt-4" style={{ color: 'rgba(11,25,87,0.4)' }}>
        Demo: koi bhi 4 digit daalein
      </p>
    </div>
  );
}
