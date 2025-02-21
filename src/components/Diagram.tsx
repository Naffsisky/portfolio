import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { projects, tagColors } from '@/app/projects/data/projects'

const techStackCount: Record<string, number> = {}
projects.forEach((project) => {
  if (project.tags && Array.isArray(project.tags)) {
    project.tags.forEach((tech) => {
      techStackCount[tech] = (techStackCount[tech] || 0) + 1
    })
  }
})

const data = Object.entries(techStackCount)
  .map(([name, value]) => ({ name, value }))
  .sort((a, b) => b.value - a.value)

const COLORS = ['#2196f3', '#ffeb3b', '#4caf50', '#ff9800', '#9c27b0', '#f44336', '#00bcd4', '#009688', '#3f51b5', '#e91e63', '#ffc107', '#607d8b', '#795548', '#cddc39']

const Diagram = () => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" label>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

export default Diagram
