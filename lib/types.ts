export type Subject = 'Physics' | 'Chemistry' | 'Mathematics' | 'General'
export type Priority = 'urgent' | 'high' | 'medium' | 'low'
export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'overdue'
export type TopicStatus = 'not_started' | 'in_progress' | 'revised' | 'mastered'
export type ExamType = 'JEE_Main' | 'JEE_Advanced' | 'BITSAT' | 'Other'
export type ExamPriority = 'critical' | 'high' | 'medium' | 'low'
export type MistakeType = 'concept' | 'calculation' | 'silly' | 'time_management'
export type SessionType = 'concept' | 'practice' | 'revision' | 'mock_analysis'
export type TestType = 'Full Mock' | 'Part Mock' | 'Chapter Test' | 'Minor Test'

export interface Profile {
  id: string
  email: string
  full_name: string
  target_exam: string
  created_at: string
  streak: number
  last_active_date: string
  discipline_score: number
}

export interface Todo {
  id: string
  user_id: string
  title: string
  description?: string
  subject: Subject
  priority: Priority
  status: TodoStatus
  due_date?: string
  due_time?: string
  completed_at?: string
  created_at: string
  tags?: string[]
}

export interface StudySession {
  id: string
  user_id: string
  subject: Subject
  hours: number
  session_date: string
  session_type: SessionType
  notes?: string
  focus_score?: number
  created_at: string
}

export interface Chapter {
  id: string
  user_id: string
  subject_id: string
  name: string
  weightage: number
  status: TopicStatus
  completion_percent: number
  last_revised?: string
  revision_due?: string
  is_weak: boolean
  created_at: string
  subtopics?: Subtopic[]
}

export interface Subtopic {
  id: string
  user_id: string
  chapter_id: string
  name: string
  status: TopicStatus
  notes?: string
  created_at: string
}

export interface SubjectRecord {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
  chapters?: Chapter[]
}

export interface Exam {
  id: string
  user_id: string
  name: string
  exam_date: string
  exam_type: ExamType
  priority: ExamPriority
  notes?: string
  created_at: string
}

export interface Mark {
  id: string
  user_id: string
  test_name: string
  test_date: string
  test_type: TestType
  physics_marks?: number
  chemistry_marks?: number
  mathematics_marks?: number
  physics_total?: number
  chemistry_total?: number
  mathematics_total?: number
  total_marks?: number
  total_out_of?: number
  rank?: number
  time_taken?: number
  accuracy?: number
  mistakes?: string
  analysis_done: boolean
  improvement_notes?: string
  created_at: string
}

export interface Mistake {
  id: string
  user_id: string
  subject?: string
  topic?: string
  mistake_type: MistakeType
  description: string
  mark_id?: string
  resolved: boolean
  created_at: string
}
