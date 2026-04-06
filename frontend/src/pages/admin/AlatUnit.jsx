import { useEffect } from 'react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../lib/api'

export default function AlatUnit () {
  const { id } = useParams()
  const [data, setData] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/alat/${id}/unit`)
        setData(res.data)
      } catch (err) {
        console.error('Gagal ambil unit:', err)
      }
    }

    fetchData()
  }, [id])

  return (
    <div>
      <h1 className='font-bold mb-4'>Detail Unit Alat</h1>

      <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
        {data.map(u => (
          <div
            key={u.id_unit}
            className={`p-3 rounded-lg border text-xs font-mono ${
              u.status === 'tersedia'
                ? 'bg-green-50 text-green-600'
                : 'bg-red-50 text-red-500'
            }`}
          >
            {u.kode_unit}
            <div className='text-[10px] mt-1'>{u.status}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
