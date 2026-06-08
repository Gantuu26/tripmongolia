import React, { useState } from 'react';
import { uploadImage } from '../utils/upload';

const LANGUAGES = ['한국어', '영어', '몽골어', '중국어', '일본어'];
const SPECIALTIES = ['고비사막', '홉스굴', '테렐지', '승마', '문화체험', '사진촬영'];

export const GuideApply: React.FC = () => {
    const [form, setForm] = useState({
        name: '',
        phone: '',
        bio: '',
        experience_years: '',
        image: '',
        languages: [] as string[],
        specialties: [] as string[],
    });
    const [imagePreview, setImagePreview] = useState('');
    const [imageUploading, setImageUploading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const toggle = (field: 'languages' | 'specialties', value: string) => {
        setForm(prev => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter(v => v !== value)
                : [...prev[field], value],
        }));
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImagePreview(URL.createObjectURL(file));
        setImageUploading(true);
        try {
            const url = await uploadImage(file, 'guides');
            setForm(prev => ({ ...prev, image: url }));
        } catch {
            setError('이미지 업로드에 실패했습니다. 다시 시도해 주세요.');
        } finally {
            setImageUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.phone.trim()) {
            setError('성함과 전화번호는 필수 항목입니다.');
            return;
        }
        if (imageUploading) {
            setError('이미지 업로드가 완료될 때까지 기다려 주세요.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/tour-guides/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    experience_years: form.experience_years ? Number(form.experience_years) : 0,
                }),
            });
            if (!res.ok) throw new Error('전송에 실패했습니다.');
            setSubmitted(true);
        } catch (e: any) {
            setError(e.message || '전송에 실패했습니다. 다시 시도해 주세요.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-rose-600 text-3xl">check_circle</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">신청이 접수되었습니다</h2>
                    <p className="text-gray-600 leading-relaxed">
                        신청해 주셔서 감사합니다.<br />
                        담당자가 내용을 확인한 후 <strong>2~3 영업일 이내</strong>에 연락드리겠습니다.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
                        🐴 Trip Mongolia
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">가이드 등록 신청</h1>
                    <p className="text-gray-500 text-sm">몽골여행 공인 가이드로 등록 신청을 하실 수 있습니다</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-5">

                    {/* Profile Photo */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">프로필 사진</label>
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                                ) : (
                                    <span className="material-symbols-outlined text-3xl text-gray-300">person</span>
                                )}
                            </div>
                            <div className="flex-1">
                                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                                    <span className="material-symbols-outlined text-base">upload</span>
                                    {imageUploading ? '업로드 중...' : '사진 선택'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                        disabled={imageUploading}
                                    />
                                </label>
                                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP 지원</p>
                            </div>
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">
                            성함 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            placeholder="홍길동"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">
                            전화번호 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="tel"
                            value={form.phone}
                            onChange={e => setForm({ ...form, phone: e.target.value })}
                            placeholder="010-0000-0000"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                        />
                    </div>

                    {/* Experience Years */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">가이드 경력 연수</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                min="0"
                                max="50"
                                value={form.experience_years}
                                onChange={e => setForm({ ...form, experience_years: e.target.value })}
                                placeholder="0"
                                className="w-28 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-center"
                            />
                            <span className="text-sm text-gray-600">년</span>
                        </div>
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">자기소개</label>
                        <textarea
                            value={form.bio}
                            onChange={e => setForm({ ...form, bio: e.target.value })}
                            placeholder="가이드 경력, 자신 있는 지역, 자격증 등을 기입해 주세요"
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 resize-none"
                        />
                    </div>

                    {/* Languages */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">가능 언어</label>
                        <div className="flex flex-wrap gap-2">
                            {LANGUAGES.map(lang => (
                                <button
                                    key={lang}
                                    type="button"
                                    onClick={() => toggle('languages', lang)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                        form.languages.includes(lang)
                                            ? 'bg-rose-500 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Specialties */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">전문 분야</label>
                        <div className="flex flex-wrap gap-2">
                            {SPECIALTIES.map(sp => (
                                <button
                                    key={sp}
                                    type="button"
                                    onClick={() => toggle('specialties', sp)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                        form.specialties.includes(sp)
                                            ? 'bg-rose-500 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {sp}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-lg">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || imageUploading}
                        className="w-full bg-rose-600 text-white font-bold py-4 rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />전송 중...</>
                        ) : '신청서 제출하기'}
                    </button>
                </form>

                <p className="text-center text-xs text-gray-400 mt-4">
                    © Trip Mongolia — mongolryokou.com
                </p>
            </div>
        </div>
    );
};