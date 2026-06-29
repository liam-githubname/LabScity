// import { createClient } from '@/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest){
    // Uncomment if you're trying to test with curl/postman
    const supabase = await createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_SECRET_SUPABASE_KEY!
    );

    // const supabase = await createClient();

    const userId = request.nextUrl.searchParams.get('user_id');
    // const { data: { user } } = await supabase.auth.getUser();

    // if(!user){
    //   return NextResponse.json(
    //       { error: 'Unauthorized'},
    //       {status: 401}
    //   );
    // }
        
    const { data, error } = await supabase
    .rpc('get_collaborators', 
        // { current_user_id: user.id}
        { current_user_id: userId}
    );

    if(error){
        return NextResponse.json(
            { error: error.message},
            { status: 500 }
        );
    }
    return NextResponse.json(data);
}