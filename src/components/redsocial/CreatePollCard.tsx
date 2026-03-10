import { useState } from 'react';
import { Plus, X, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateEncuestaInput } from '@/hooks/entidades/useEncuestas';

interface CreatePollCardProps {
  onSubmit: (data: CreateEncuestaInput) => void;
  isLoading: boolean;
  publicacionId?: string;
  onCancel?: () => void;
}

export function CreatePollCard({ onSubmit, isLoading, publicacionId, onCancel }: CreatePollCardProps) {
  const [pregunta, setPregunta] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState<'simple' | 'multiple' | 'si_no'>('simple');
  const [opciones, setOpciones] = useState(['', '']);
  const [fechaCierre, setFechaCierre] = useState('');

  const addOpcion = () => {
    if (opciones.length < 10) {
      setOpciones([...opciones, '']);
    }
  };

  const removeOpcion = (index: number) => {
    if (opciones.length > 2) {
      setOpciones(opciones.filter((_, i) => i !== index));
    }
  };

  const updateOpcion = (index: number, value: string) => {
    const updated = [...opciones];
    updated[index] = value;
    setOpciones(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validOpciones = tipo === 'si_no' ? ['Sí', 'No'] : opciones.filter(o => o.trim());
    if (!pregunta.trim() || (tipo !== 'si_no' && validOpciones.length < 2)) return;

    onSubmit({
      pregunta: pregunta.trim(),
      descripcion: descripcion.trim() || undefined,
      tipo,
      publicacion_id: publicacionId,
      fecha_cierre: fechaCierre ? new Date(fechaCierre).toISOString() : undefined,
      opciones: validOpciones,
    });

    setPregunta('');
    setDescripcion('');
    setOpciones(['', '']);
    setFechaCierre('');
  };

  const isValid = pregunta.trim() && (tipo === 'si_no' || opciones.filter(o => o.trim()).length >= 2);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Crear Encuesta
          </CardTitle>
          {onCancel && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Pregunta *</Label>
            <Input
              value={pregunta}
              onChange={e => setPregunta(e.target.value)}
              placeholder="¿Cuál es tu pregunta?"
              maxLength={300}
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Descripción</Label>
            <Textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Contexto adicional (opcional)"
              rows={2}
              maxLength={500}
              className="text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Opción única</SelectItem>
                  <SelectItem value="multiple">Opción múltiple</SelectItem>
                  <SelectItem value="si_no">Sí / No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cierre (opcional)</Label>
              <Input
                type="datetime-local"
                value={fechaCierre}
                onChange={e => setFechaCierre(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          {tipo !== 'si_no' && (
            <div className="space-y-2">
              <Label className="text-xs">Opciones *</Label>
              {opciones.map((op, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={op}
                    onChange={e => updateOpcion(index, e.target.value)}
                    placeholder={`Opción ${index + 1}`}
                    className="text-sm"
                    maxLength={200}
                  />
                  {opciones.length > 2 && (
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => removeOpcion(index)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              {opciones.length < 10 && (
                <Button type="button" variant="outline" size="sm" className="w-full text-xs" onClick={addOpcion}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Agregar opción
                </Button>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" size="sm" disabled={isLoading || !isValid}>
            {isLoading ? 'Creando...' : 'Publicar Encuesta'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
